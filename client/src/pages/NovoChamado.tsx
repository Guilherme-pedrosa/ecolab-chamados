import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft } from "lucide-react";

export default function NovoChamado() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    numeroOS: "",
    numeroTarefa: "",
    dataOS: new Date().toISOString().split('T')[0],
    dataAtendimento: "",
    distrito: "",
    nomeGT: "",
    codCliente: "",
    cliente: "",
    nomeTRA: "",
    observacao: "",
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.chamados.create.useMutation({
    onSuccess: () => {
      utils.chamados.list.invalidate();
      toast.success("Chamado criado com sucesso!");
      setLocation("/chamados");
    },
    onError: (error) => {
      toast.error("Erro ao criar chamado: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numeroOS) {
      toast.error("Número da OS é obrigatório");
      return;
    }

    createMutation.mutate({
      numeroOS: formData.numeroOS,
      numeroTarefa: formData.numeroTarefa || undefined,
      dataOS: new Date(formData.dataOS),
      dataAtendimento: formData.dataAtendimento ? new Date(formData.dataAtendimento) : undefined,
      distrito: formData.distrito || undefined,
      nomeGT: formData.nomeGT || undefined,
      codCliente: formData.codCliente || undefined,
      cliente: formData.cliente || undefined,
      nomeTRA: formData.nomeTRA || undefined,
      observacao: formData.observacao || undefined,
      status: "aberto",
    });
  };

  return (
    <DashboardLayout>
      <div className="container py-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/chamados")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Chamados
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Novo Chamado</CardTitle>
            <CardDescription>
              Preencha os dados do chamado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="numeroOS">Número OS *</Label>
                  <Input
                    id="numeroOS"
                    value={formData.numeroOS}
                    onChange={(e) => setFormData({ ...formData, numeroOS: e.target.value })}
                    placeholder="Ex: 82152"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="numeroTarefa">Número da Tarefa</Label>
                  <Input
                    id="numeroTarefa"
                    value={formData.numeroTarefa}
                    onChange={(e) => setFormData({ ...formData, numeroTarefa: e.target.value })}
                    placeholder="Ex: T-2024-001"
                  />
                </div>

                <div>
                  <Label htmlFor="dataOS">Data OS *</Label>
                  <Input
                    id="dataOS"
                    type="date"
                    value={formData.dataOS}
                    onChange={(e) => setFormData({ ...formData, dataOS: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dataAtendimento">Data do Atendimento</Label>
                  <Input
                    id="dataAtendimento"
                    type="date"
                    value={formData.dataAtendimento}
                    onChange={(e) => setFormData({ ...formData, dataAtendimento: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="distrito">Distrito</Label>
                  <Input
                    id="distrito"
                    value={formData.distrito}
                    onChange={(e) => setFormData({ ...formData, distrito: e.target.value })}
                    placeholder="Ex: 08"
                  />
                </div>

                <div>
                  <Label htmlFor="nomeGT">Nome GT</Label>
                  <Input
                    id="nomeGT"
                    value={formData.nomeGT}
                    onChange={(e) => setFormData({ ...formData, nomeGT: e.target.value })}
                    placeholder="Ex: RENE ROSA"
                  />
                </div>

                <div>
                  <Label htmlFor="codCliente">Código Cliente</Label>
                  <Input
                    id="codCliente"
                    value={formData.codCliente}
                    onChange={(e) => setFormData({ ...formData, codCliente: e.target.value })}
                    placeholder="Ex: 81050108"
                  />
                </div>

                <div>
                  <Label htmlFor="nomeTRA">Nome TRA</Label>
                  <Input
                    id="nomeTRA"
                    value={formData.nomeTRA}
                    onChange={(e) => setFormData({ ...formData, nomeTRA: e.target.value })}
                    placeholder="Ex: WD COMÉRCIO"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    placeholder="Ex: NUTRIZA FRIATO"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    placeholder="Digite observações sobre o chamado"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Chamado"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/chamados")}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

