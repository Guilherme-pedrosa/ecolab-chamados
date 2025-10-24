import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

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
    
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null) {
          return val as any;
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input, ctx }) => {
        const { createChamado } = await import("./db");
        return await createChamado({ ...input, createdBy: ctx.user.id });
      }),
    
    updateStatus: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && "status" in val) {
          return val as { id: number; status: "aberto" | "em_andamento" | "fechado" };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { updateChamadoStatus } = await import("./db");
        await updateChamadoStatus(input.id, input.status);
        return { success: true };
      }),
    
    delete: protectedProcedure
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
    
    importFromExcel: protectedProcedure
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
              status: "aberto",
              createdBy: ctx.user.id 
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
    
    create: protectedProcedure
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
        
        return await createEvolucao({ ...input, createdBy: ctx.user.id });
      }),
  }),
});

export type AppRouter = typeof appRouter;
