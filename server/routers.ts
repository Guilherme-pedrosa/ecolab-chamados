import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chamados: router({
    list: publicProcedure.query(async () => {
      const { getAllChamados } = await import("./db");
      return await getAllChamados();
    }),
    
    getById: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return val as { id: number };
        }
        throw new Error("Invalid input: expected { id: number }");
      })
      .query(async ({ input }) => {
        const { getChamadoById } = await import("./db");
        return await getChamadoById(input.id);
      }),
    
    create: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null) {
          return val as any;
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input, ctx }) => {
        const { createChamado } = await import("./db");
        return await createChamado({ ...input, createdBy: null });
      }),
    
    update: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val) {
          return val as any;
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { updateChamado } = await import("./db");
        const { id, ...data } = input;
        await updateChamado(id, data);
        return { success: true };
      }),
    
    updateStatus: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && "status" in val) {
          return val as { id: number; status: "aguardando_agendamento" | "agendado" | "ag_retorno" | "atendido_ag_fechamento" | "fechado" };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { updateChamadoStatus } = await import("./db");
        await updateChamadoStatus(input.id, input.status);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return val as { id: number };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { deleteChamado } = await import("./db");
        await deleteChamado(input.id);
        return { success: true };
      }),
    
    exportToExcel: publicProcedure.query(async () => {
      const { getAllChamados } = await import("./db");
      const XLSX = await import("xlsx");
      
      const chamados = await getAllChamados();
      
      // Preparar dados para exportação
      const exportData = chamados.map(c => ({
        "Nº OS": c.numeroOS,
        "Nº Tarefa": c.numeroTarefa || '',
        "Data OS": new Date(c.dataOS).toLocaleDateString('pt-BR'),
        "Data Atendimento": c.dataAtendimento ? new Date(c.dataAtendimento).toLocaleDateString('pt-BR') : '',
        "Dias em Aberto": Math.floor((new Date().getTime() - new Date(c.dataOS).getTime()) / (1000 * 60 * 60 * 24)),
        "Distrito": c.distrito || '',
        "Nome GT": c.nomeGT || '',
        "Cód. Cliente": c.codCliente || '',
        "Cliente": c.cliente || '',
        "Nome TRA": c.nomeTRA || '',
        "Observação": c.observacao || '',
        "Status": c.status === 'aguardando_agendamento' ? 'Aguardando agendamento' : 
                  c.status === 'agendado' ? 'Agendado - ag atendimento' :
                  c.status === 'ag_retorno' ? 'Ag retorno' :
                  c.status === 'atendido_ag_fechamento' ? 'Atendido - Ag fechamento' : 'Fechado',
        "Data Criação": new Date(c.createdAt).toLocaleDateString('pt-BR'),
      }));
      
      // Criar workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Chamados");
      
      // Converter para base64
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const base64 = buffer.toString('base64');
      
      return { fileBase64: base64, filename: `chamados_${new Date().toISOString().split('T')[0]}.xlsx` };
    }),
    
    importFromExcel: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "fileBase64" in val && typeof val.fileBase64 === "string") {
          return val as { fileBase64: string };
        }
        throw new Error("Invalid input: expected { fileBase64: string }");
      })
      .mutation(async ({ input, ctx }) => {
        const { createChamado } = await import("./db");
        const { processExcelFile } = await import("./excelProcessor");
        
        // Decodificar base64 para buffer
        const buffer = Buffer.from(input.fileBase64, 'base64');
        
        // Processar arquivo Excel
        const chamadosData = processExcelFile(buffer);
        
        const results = [];
        for (const chamado of chamadosData) {
          try {
            await createChamado({ 
              ...chamado, 
              status: "aguardando_agendamento",
              createdBy: null 
            });
            results.push({ success: true, numeroOS: chamado.numeroOS });
          } catch (error) {
            results.push({ 
              success: false, 
              numeroOS: chamado.numeroOS, 
              error: String(error) 
            });
          }
        }
        return { 
          total: chamadosData.length,
          imported: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results 
        };
      }),
  }),
  
  evolucoes: router({
    getByChamadoId: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "chamadoId" in val && typeof val.chamadoId === "number") {
          return val as { chamadoId: number };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ input }) => {
        const { getEvolucoesByChamadoId } = await import("./db");
        return await getEvolucoesByChamadoId(input.chamadoId);
      }),
    
    create: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null) {
          return val as any;
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input, ctx }) => {
        const { createEvolucao, getChamadoById, updateChamadoStatus } = await import("./db");
        
        // Se houver mudança de status, atualizar o chamado
        if (input.statusNovo && input.chamadoId) {
          const chamado = await getChamadoById(input.chamadoId);
          if (chamado) {
            await updateChamadoStatus(input.chamadoId, input.statusNovo);
          }
        }
        
        return await createEvolucao({ ...input, createdBy: null });
      }),
  }),
});

export type AppRouter = typeof appRouter;
