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
 * Suporta dois formatos:
 * 1. Planilha consolidada com múltiplos chamados (formato tabela)
 * 2. Ordem de serviço individual (formato formulário)
 */
export function processExcelFile(buffer: Buffer): ChamadoExcelData[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const chamados: ChamadoExcelData[] = [];

  // Tentar processar como OS individual primeiro
  const osIndividual = processOSIndividual(workbook);
  if (osIndividual) {
    chamados.push(osIndividual);
    return chamados;
  }

  // Se não for OS individual, processar como planilha consolidada
  return processConsolidatedSheet(workbook);
}

/**
 * Processa uma ordem de serviço individual (formato formulário)
 */
function processOSIndividual(workbook: XLSX.WorkBook): ChamadoExcelData | null {
  // Procurar pela sheet principal (geralmente a primeira ou com nome específico)
  const sheetNames = ['OS_Terceiro', workbook.SheetNames[0]];
  
  for (const sheetName of sheetNames) {
    if (!workbook.Sheets[sheetName]) continue;
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    let numeroOS: string | null = null;
    let dataOS: Date | null = null;
    let distrito: string | null = null;
    let nomeGT: string | null = null;
    let codCliente: string | null = null;
    let cliente: string | null = null;
    let nomeTRA: string | null = null;
    
    // Percorrer as linhas procurando pelos campos
    for (let i = 0; i < Math.min(80, data.length); i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      // Procurar número da OS
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        const cellStr = String(cell).toLowerCase().trim();
        
        // Número da OS
        if (cellStr === 'nº' && j + 1 < row.length && typeof row[j + 1] === 'number') {
          numeroOS = String(row[j + 1]);
        }
        
        // Data de abertura
        if (cellStr.includes('data abertura') && j + 1 < row.length) {
          const dateValue = row[j + 1];
          if (typeof dateValue === 'number') {
            // Converter serial date do Excel para Date
            const date = new Date((dateValue - 25569) * 86400 * 1000);
            dataOS = date;
          } else if (dateValue) {
            dataOS = new Date(dateValue);
          }
        }
        
        // Distrito
        if (cellStr.includes('distrito') && j + 1 < row.length) {
          distrito = String(row[j + 1]);
        }
        
        // Nome do solicitante (GT)
        if (cellStr.includes('nome do solicitante') && j + 1 < row.length) {
          nomeGT = String(row[j + 1]);
        }
        
        // Código do cliente
        if (cellStr.includes('cód. jde do cliente') && j + 1 < row.length) {
          codCliente = String(row[j + 1]);
        }
        
        // Nome do cliente
        if (cellStr.includes('nome do cliente') && j + 1 < row.length) {
          cliente = String(row[j + 1]);
        }
        
        // Nome TRA
        if (cellStr.includes('nome tra') && j + 1 < row.length) {
          nomeTRA = String(row[j + 1]);
        }
      }
    }
    
    // Se encontrou pelo menos o número da OS, retornar
    if (numeroOS) {
      return {
        numeroOS,
        dataOS: dataOS || new Date(),
        distrito: distrito || undefined,
        nomeGT: nomeGT || undefined,
        codCliente: codCliente || undefined,
        cliente: cliente || undefined,
        nomeTRA: nomeTRA || undefined,
      };
    }
  }
  
  return null;
}

/**
 * Processa planilha consolidada com múltiplos chamados (formato tabela)
 */
function processConsolidatedSheet(workbook: XLSX.WorkBook): ChamadoExcelData[] {
  const chamados: ChamadoExcelData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Procurar pelo cabeçalho
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some((cell: any) => 
        String(cell).toLowerCase().includes('o.s') || 
        String(cell).toLowerCase().includes('nº o.s') ||
        (String(cell).toLowerCase().includes('data') && String(cell).toLowerCase().includes('os'))
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
        // Converter serial date do Excel para Date
        const date = new Date((dataCell - 25569) * 86400 * 1000);
        dataOS = date;
      } else if (typeof dataCell === 'string') {
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

