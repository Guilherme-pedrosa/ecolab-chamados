import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function ChamadoDetalhes() {
  const [, params] = useRoute("/chamados/:id");
  const [, setLocation] = useLocation();
  const chamadoId = params?.id ? parseInt(params.id) : 0;

  const [novaEvolucao, setNovaEvolucao] = useState("");
  const [novoStatus, setNovoStatus] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    numeroTarefa: "",
    dataAtendimento: "",
    dataFechamento: "",
    observacao: "",
  });

  const { data: chamado, isLoading } = trpc.chamados.getById.useQuery({ id: chamadoId });
  
  useEffect(() => {
    if (chamado) {
      setEditData({
        numeroTarefa: chamado?.numeroTarefa || "",
        dataAtendimento: chamado?.dataAtendimento 
          ? new Date(chamado.dataAtendimento).toISOString().split('T')[0] 
          : "",
        dataFechamento: chamado?.dataFechamento 
          ? new Date(chamado.dataFechamento).toISOString().split('T')[0] 
          : "",
        observacao: chamado?.observacao || "",
      });
    }
  }, [chamado]);
  const { data: evolucoes, refetch: refetchEvolucoes } = trpc.evolucoes.getByChamadoId.useQuery({ chamadoId });
  
  const utils = trpc.useUtils();
  
  const deleteChamado = trpc.chamados.delete.useMutation({
    onSuccess: () => {
      toast.success("Chamado excluído com sucesso!");
      setLocation("/chamados");
    },
    onError: (error) => {
      toast.error("Erro ao excluir chamado: " + error.message);
    },
  });
  
  const updateChamado = trpc.chamados.update.useMutation({
    onSuccess: () => {
      utils.chamados.list.invalidate();
      utils.chamados.getById.invalidate({ id: chamadoId });
      setIsEditing(false);
      toast.success("Chamado atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar chamado: " + error.message);
    },
  });
  
  const createEvolucao = trpc.evolucoes.create.useMutation({
    onSuccess: () => {
      refetchEvolucoes();
      utils.chamados.list.invalidate();
      utils.chamados.getById.invalidate({ id: chamadoId });
      setNovaEvolucao("");
      setNovoStatus("");
      toast.success("Evolução adicionada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar evolução: " + error.message);
    },
  });

  const handleAddEvolucao = () => {
    if (!novaEvolucao.trim()) {
      toast.error("Por favor, descreva a evolução");
      return;
    }

    createEvolucao.mutate({
      chamadoId,
      descricao: novaEvolucao,
      statusAnterior: chamado?.status,
      statusNovo: novoStatus || chamado?.status,
    });
  };

  const calcularDias = (dataOS: Date | string) => {
    const data = new Date(dataOS);
    const hoje = new Date();
    const diff = hoje.getTime() - data.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      aberto: "destructive",
      em_andamento: "default",
      fechado: "secondary",
    } as const;
    
    const labels = {
      aberto: "Aberto",
      em_andamento: "Em Andamento",
      fechado: "Fechado",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">Carregando...</div>
      </DashboardLayout>
    );
  }

  if (!chamado) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chamado não encontrado</p>
          <Button onClick={() => setLocation("/chamados")} className="mt-4">
            Voltar para lista
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/chamados")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Chamado #{chamado.numeroOS}</h1>
              <p className="text-muted-foreground">
                Aberto há {calcularDias(chamado.dataOS)} dias
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm(`Tem certeza que deseja excluir o chamado ${chamado.numeroOS}?`)) {
                deleteChamado.mutate({ id: chamadoId });
              }
            }}
            disabled={deleteChamado.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteChamado.isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </div>

        {/* Informações do Chamado */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informações do Chamado</CardTitle>
              {getStatusBadge(chamado.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Número OS</Label>
                <p className="font-medium">{chamado.numeroOS}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Número da Tarefa</Label>
                {isEditing ? (
                  <Input
                    value={editData.numeroTarefa}
                    onChange={(e) => setEditData({ ...editData, numeroTarefa: e.target.value })}
                    placeholder="Digite o número da tarefa"
                  />
                ) : (
                  <p className="font-medium">{chamado.numeroTarefa || "-"}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Data OS</Label>
                <p className="font-medium">
                  {new Date(chamado.dataOS).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Data do Atendimento</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editData.dataAtendimento}
                    onChange={(e) => setEditData({ ...editData, dataAtendimento: e.target.value })}
                  />
                ) : (
                  <p className="font-medium">
                    {chamado.dataAtendimento ? new Date(chamado.dataAtendimento).toLocaleDateString('pt-BR') : "-"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Data do Fechamento</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editData.dataFechamento}
                    onChange={(e) => setEditData({ ...editData, dataFechamento: e.target.value })}
                  />
                ) : (
                  <p className="font-medium">
                    {chamado.dataFechamento ? new Date(chamado.dataFechamento).toLocaleDateString('pt-BR') : "-"}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Distrito</Label>
                <p className="font-medium">{chamado.distrito || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nome GT</Label>
                <p className="font-medium">{chamado.nomeGT || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Código Cliente</Label>
                <p className="font-medium">{chamado.codCliente || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nome TRA</Label>
                <p className="font-medium">{chamado.nomeTRA || "-"}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Cliente</Label>
                <p className="font-medium">{chamado.cliente || "-"}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Observação</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.observacao}
                    onChange={(e) => setEditData({ ...editData, observacao: e.target.value })}
                    placeholder="Digite observações sobre o chamado"
                    rows={3}
                  />
                ) : (
                  <p className="font-medium whitespace-pre-wrap">{chamado.observacao || "-"}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {isEditing ? (
                <>
                  <Button
                    onClick={() => {
                      updateChamado.mutate({
                        id: chamadoId,
                        numeroTarefa: editData.numeroTarefa || null,
                        dataAtendimento: editData.dataAtendimento ? new Date(editData.dataAtendimento) : null,
                        dataFechamento: editData.dataFechamento ? new Date(editData.dataFechamento) : null,
                        observacao: editData.observacao || null,
                      });
                    }}
                    disabled={updateChamado.isPending}
                  >
                    {updateChamado.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Editar Informações
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Nova Evolução */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Evolução</CardTitle>
            <CardDescription>
              Registre uma nova atualização para este chamado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o que foi feito ou a situação atual..."
                value={novaEvolucao}
                onChange={(e) => setNovaEvolucao(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Atualizar Status (opcional)</Label>
              <Select value={novoStatus} onValueChange={setNovoStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Manter status atual" />
                </SelectTrigger>
            <SelectContent>
              <SelectItem value="aguardando_agendamento">Aguardando agendamento</SelectItem>
              <SelectItem value="agendado">Agendado - ag atendimento</SelectItem>
              <SelectItem value="ag_retorno">Ag retorno</SelectItem>
              <SelectItem value="atendido_ag_fechamento">Atendido - Ag fechamento</SelectItem>
              <SelectItem value="fechado">Fechado</SelectItem>
            </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAddEvolucao} 
              disabled={createEvolucao.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Evolução
            </Button>
          </CardContent>
        </Card>

        {/* Histórico de Evoluções */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Evoluções</CardTitle>
            <CardDescription>
              {evolucoes?.length || 0} evolução(ões) registrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!evolucoes || evolucoes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma evolução registrada ainda
              </p>
            ) : (
              <div className="space-y-4">
                {evolucoes.map((evolucao) => (
                  <div key={evolucao.id} className="border-l-2 border-primary pl-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(evolucao.createdAt).toLocaleString('pt-BR')}
                      </span>
                      {evolucao.statusNovo && evolucao.statusAnterior !== evolucao.statusNovo && (
                        <div className="flex items-center gap-2">
                          {getStatusBadge(evolucao.statusAnterior || "")}
                          <span className="text-muted-foreground">→</span>
                          {getStatusBadge(evolucao.statusNovo)}
                        </div>
                      )}
                    </div>
                    <p className="text-sm">{evolucao.descricao}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

