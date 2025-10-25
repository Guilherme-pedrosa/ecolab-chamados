import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface ChamadoRowProps {
  chamado: any;
  onUpdate: () => void;
  onDelete: (id: number) => void;
}

export function ChamadoRow({ chamado, onUpdate, onDelete }: ChamadoRowProps) {
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    numeroTarefa: chamado.numeroTarefa || "",
    dataAtendimento: chamado.dataAtendimento 
      ? new Date(chamado.dataAtendimento).toISOString().split('T')[0] 
      : "",
    dataFechamento: chamado.dataFechamento 
      ? new Date(chamado.dataFechamento).toISOString().split('T')[0] 
      : "",
    observacao: chamado.observacao || "",
    status: chamado.status,
  });

  const updateMutation = trpc.chamados.update.useMutation({
    onSuccess: () => {
      onUpdate();
      setDialogOpen(false);
      toast.success("Chamado atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: chamado.id,
      numeroTarefa: editData.numeroTarefa || null,
      dataAtendimento: editData.dataAtendimento ? new Date(editData.dataAtendimento) : null,
      dataFechamento: editData.dataFechamento ? new Date(editData.dataFechamento) : null,
      observacao: editData.observacao || null,
      status: editData.status,
    });
  };

  const calcularDias = (dataOS: string) => {
    const hoje = new Date();
    const data = new Date(dataOS);
    const diff = hoje.getTime() - data.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      aguardando_agendamento: { label: "Aguardando agendamento", className: "bg-yellow-500 text-white" },
      agendado: { label: "Agendado - ag atendimento", className: "bg-blue-500 text-white" },
      ag_retorno: { label: "Ag retorno", className: "bg-red-800 text-white" },
      atendido_ag_fechamento: { label: "Atendido - Ag fechamento", className: "bg-green-400 text-white" },
      fechado: { label: "Fechado", className: "bg-green-800 text-white" },
    } as const;
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: "" };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{chamado.numeroOS}</TableCell>
      <TableCell>{chamado.numeroTarefa || "-"}</TableCell>
      <TableCell>{new Date(chamado.dataOS).toLocaleDateString('pt-BR')}</TableCell>
      <TableCell>
        {chamado.dataAtendimento 
          ? new Date(chamado.dataAtendimento).toLocaleDateString('pt-BR') 
          : "-"}
      </TableCell>
      <TableCell>
        {chamado.dataFechamento 
          ? new Date(chamado.dataFechamento).toLocaleDateString('pt-BR') 
          : "-"}
      </TableCell>
      <TableCell>{calcularDias(chamado.dataOS)}</TableCell>
      <TableCell>{chamado.distrito}</TableCell>
      <TableCell>{chamado.nomeGT}</TableCell>
      <TableCell>{chamado.cliente}</TableCell>
      <TableCell className="max-w-xs truncate">{chamado.observacao || "-"}</TableCell>
      <TableCell>{getStatusBadge(chamado.status)}</TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditData({
                    numeroTarefa: chamado.numeroTarefa || "",
                    dataAtendimento: chamado.dataAtendimento 
                      ? new Date(chamado.dataAtendimento).toISOString().split('T')[0] 
                      : "",
                    dataFechamento: chamado.dataFechamento 
                      ? new Date(chamado.dataFechamento).toISOString().split('T')[0] 
                      : "",
                    observacao: chamado.observacao || "",
                    status: chamado.status,
                  });
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Chamado #{chamado.numeroOS}</DialogTitle>
                <DialogDescription>
                  Atualize as informações do chamado
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroTarefa">Número da Tarefa</Label>
                  <Input
                    id="numeroTarefa"
                    value={editData.numeroTarefa}
                    onChange={(e) => setEditData({ ...editData, numeroTarefa: e.target.value })}
                    placeholder="Número da tarefa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataAtendimento">Data do Atendimento</Label>
                  <Input
                    id="dataAtendimento"
                    type="date"
                    value={editData.dataAtendimento}
                    onChange={(e) => setEditData({ ...editData, dataAtendimento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFechamento">Data do Fechamento</Label>
                  <Input
                    id="dataFechamento"
                    type="date"
                    value={editData.dataFechamento}
                    onChange={(e) => setEditData({ ...editData, dataFechamento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editData.status}
                    onValueChange={(value) => setEditData({ ...editData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
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
                <div className="space-y-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    value={editData.observacao}
                    onChange={(e) => setEditData({ ...editData, observacao: e.target.value })}
                    placeholder="Observações sobre o chamado"
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLocation(`/chamados/${chamado.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (confirm(`Excluir chamado ${chamado.numeroOS}?`)) {
                onDelete(chamado.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

