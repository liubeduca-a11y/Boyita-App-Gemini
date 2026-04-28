import React, { useState } from 'react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useStore, BabyEvent } from '../store';

export function DataImporter() {
  const [csvData, setCsvData] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const { familyId } = useStore();

  const parseDateTime = (fecha: string, hora: string) => {

    // fecha: "27 abr 2026"
    // hora: "08:07 PM"
    const months: Record<string, number> = {
      'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };

    const [dayStr, monthStr, yearStr] = fecha.split(' ');
    if (!dayStr || !monthStr || !yearStr) {
      throw new Error(`Invalid date format (day/month/year missing): ${fecha}`);
    }
    const day = parseInt(dayStr, 10);
    const year = parseInt(yearStr, 10);
    const month = months[monthStr.toLowerCase()];

    // Parse time
    const [time, ampm] = hora.split(' ');
    if (!time || !ampm) {
      throw new Error(`Invalid time format (time/ampm missing): ${hora}`);
    }
    const [hourStr, minStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (ampm.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    return new Date(year, month, day, hour, minute);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setCsvData(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setStatus('Importando...');
    try {
      const lines = csvData.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) {
        setStatus('No hay datos para importar.');
        setLoading(false);
        return;
      }
      // Skip header if it is "Fecha,Hora,Tipo,Detalle,Notas"
      if (lines[0].toLowerCase().startsWith('fecha')) {
        lines.shift();
      }

      if (!familyId) {
        setStatus('Error: No se encontró el ID de familia. Intenta recargar la página.');
        setLoading(false);
        return;
      }

      const eventsRef = collection(db, `families/${familyId}/events`);
      let count = 0;

      for (const line of lines) {
        // Simple CSV parser that handles commas inside quotes (though maybe not needed strictly if notas are simple, but we should be careful)
        const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
        // actually for ease, since they are structured: Fecha,Hora,Tipo,Detalle,Notas
        let matches = [];
        let inQuote = false;
        let currentString = '';
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' && inQuote) {
            inQuote = false;
          } else if (char === '"' && !inQuote) {
            inQuote = true;
          } else if (char === ',' && !inQuote) {
            matches.push(currentString);
            currentString = '';
          } else {
            currentString += char;
          }
        }
        matches.push(currentString); // last one

        const fecha = matches[0];
        const hora = matches[1];
        const type = matches[2];
        const detail = matches[3];
        let notes = matches[4] || '';
        
        // Sometimes the last note column isn't correctly extracted if there's trailing commas, cleanup:
        notes = notes.replace(/^"|"$/g, '').trim();

        if (!fecha || !hora) {
          console.warn(`Skipping line with missing fecha or hora: ${line}`);
          continue;
        }

        const dateObj = parseDateTime(fecha, hora);
        const eventType = (type && type.trim() !== '' ? type : 'notes') as BabyEvent['type'];
        
        const eventData: any = {
          type: eventType,
          timestamp: dateObj.getTime(),
          notes: notes,
        };

        if (eventType === 'feeding' && detail) {
           const match = detail.match(/([\d.]+)\s*oz/);
           if (match) {
             eventData.details = { amount: parseFloat(match[1]) };
           }
        } else if (eventType === 'hygiene' && detail) {
           eventData.details = {};
           if (detail.includes('Popó')) {
             eventData.details.hygieneType = 'poo';
             if (detail.toLowerCase().includes('liquido') || detail.toLowerCase().includes('líquido')) eventData.details.texture = 'liquido';
             else if (detail.toLowerCase().includes('viscoso')) eventData.details.texture = 'viscoso';
             else if (detail.toLowerCase().includes('pastoso')) eventData.details.texture = 'pastoso';
             else if (detail.toLowerCase().includes('duro')) eventData.details.texture = 'duro';
             else if (detail.toLowerCase().includes('diarrea')) eventData.details.texture = 'diarrea';
           } else if (detail.includes('Pipí')) {
             eventData.details.hygieneType = 'pee';
             if (detail.toLowerCase().includes('poco')) eventData.details.level = 'poco';
             else if (detail.toLowerCase().includes('medio')) eventData.details.level = 'medio';
             else if (detail.toLowerCase().includes('lleno') || detail.toLowerCase().includes('mucho')) eventData.details.level = 'lleno';
           } else if (detail.toLowerCase().includes('estreñimiento')) {
             eventData.details.hygieneType = 'constipation';
           }
        } else if (eventType === 'sleep' && detail) {
           const match = detail.match(/Durmió\s+(\d+)h\s+(\d+)m/);
           if (match) {
             const hours = parseInt(match[1], 10);
             const mins = parseInt(match[2], 10);
             eventData.endTimestamp = dateObj.getTime() + (hours * 3600000) + (mins * 60000);
           }
        }

        await addDoc(eventsRef, eventData);
        count++;
        setStatus(`Importando... ${count}/${lines.length}`);
      }

      setStatus(`Importación completada! ${count} registros insertados.`);
    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow mt-4 text-black">
      <h2 className="text-lg font-bold mb-4">Importar Datos CSV (DataImporter)</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sube tu archivo CSV:
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          O pega el contenido de tu CSV aquí:
        </label>
        <textarea
          className="w-full h-32 p-2 border rounded text-black"
          placeholder="Pega tu CSV aquí..."
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
        ></textarea>
      </div>

      <button
        onClick={handleImport}
        disabled={loading || !csvData.trim()}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Importar CSV'}
      </button>
      <p className="mt-2 text-sm text-gray-600">{status}</p>
    </div>
  );
}
