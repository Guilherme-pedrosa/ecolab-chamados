import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";

/**
 * All content in this page are only for example, delete if unneeded
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: chamados } = trpc.chamados.list.useQuery();

  const chamadosAbertos = chamados?.filter(c => c.status === 'aguardando_agendamento').length || 0;
  const chamadosEmAndamento = chamados?.filter(c => ['agendado', 'ag_retorno', 'atendido_ag_fechamento'].includes(c.status)).length || 0;
  const chamadosFechados = chamados?.filter(c => c.status === 'fechado').length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao Sistema de Gerenciamento de Chamados Ecolab
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Chamados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chamados?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os chamados no sistema
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chamados Abertos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{chamadosAbertos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando atendimento
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{chamadosEmAndamento}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sendo processados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fechados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{chamadosFechados}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Concluídos
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Início Rápido</CardTitle>
            <CardDescription>
              Comece a gerenciar seus chamados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Como usar o sistema:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Importe planilhas Excel com os chamados através da página de Chamados</li>
                <li>Visualize e filtre os chamados por status, distrito ou técnico</li>
                <li>Clique em um chamado para ver detalhes e adicionar evoluções</li>
                <li>Acompanhe o progresso através do histórico de evoluções</li>
              </ol>
            </div>
            <Button asChild>
              <a href="/chamados">Ir para Chamados</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
