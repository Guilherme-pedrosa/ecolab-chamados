import * as XLSX from 'xlsx';

export interface ChamadoExcelData {
  numeroOS: string;
  dataOS: Date;
  distrito?: string;
  nomeGT?: string;
  codCliente?: string;
  cliente?: string;
  nomeTRA?: string;
}

/**
 * Processa um buffer de arquivo Excel e extrai os dados dos chamados
 */
export function processExcelFile(buffer: Buffer): ChamadoExcelData[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const chamados: ChamadoExcelData[] = [];

  // Processar todas as sheets
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Procurar pelo cabeçalho
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some((cell: any) => 
        String(cell).toLowerCase().includes('o.s') || 
        String(cell).toLowerCase().includes('os') ||
        String(cell).toLowerCase().includes('data')
      )) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) continue;

    const headers = data[headerRowIndex].map((h: any) => String(h).toLowerCase().trim());
    
    // Mapear índices das colunas
    const colMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      if (header.includes('o.s') || header.includes('nº o.s')) colMap.numeroOS = index;
      else if (header.includes('data') && header.includes('os')) colMap.dataOS = index;
      else if (header.includes('distrito')) colMap.distrito = index;
      else if (header.includes('nome') && header.includes('gt')) colMap.nomeGT = index;
      else if (header.includes('cod') && header.includes('cliente')) colMap.codCliente = index;
      else if (header === 'cliente') colMap.cliente = index;
      else if (header.includes('nome') && header.includes('t.r.a')) colMap.nomeTRA = index;
    });

    // Processar dados
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const numeroOS = row[colMap.numeroOS];
      if (!numeroOS) continue;

      // Ignorar linhas de totais/resumo
      const numeroOSStr = String(numeroOS).toLowerCase();
      if (numeroOSStr.includes('qtde') || numeroOSStr.includes('total')) continue;

      let dataOS: Date;
      const dataCell = row[colMap.dataOS];
      
      if (typeof dataCell === 'number') {
        // Excel date serial number
        dataOS = XLSX.SSF.parse_date_code(dataCell);
      } else if (typeof dataCell === 'string') {
        // Try to parse string date (DD/MM/YYYY)
        const parts = dataCell.split('/');
        if (parts.length === 3) {
          dataOS = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          dataOS = new Date(dataCell);
        }
      } else {
        dataOS = new Date();
      }

      chamados.push({
        numeroOS: String(numeroOS),
        dataOS,
        distrito: colMap.distrito !== undefined ? String(row[colMap.distrito] || '') : undefined,
        nomeGT: colMap.nomeGT !== undefined ? String(row[colMap.nomeGT] || '') : undefined,
        codCliente: colMap.codCliente !== undefined ? String(row[colMap.codCliente] || '') : undefined,
        cliente: colMap.cliente !== undefined ? String(row[colMap.cliente] || '') : undefined,
        nomeTRA: colMap.nomeTRA !== undefined ? String(row[colMap.nomeTRA] || '') : undefined,
      });
    }
  }

  return chamados;
}

