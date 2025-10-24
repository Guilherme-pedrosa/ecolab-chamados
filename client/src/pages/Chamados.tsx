import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Search, Filter, Plus, Eye, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { ChamadoRow } from "@/components/ChamadoRow";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Chamados() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [, setLocation] = useLocation();

  const { data: chamados, isLoading, refetch } = trpc.chamados.list.useQuery();
  const { refetch: exportExcel, isFetching: isExporting } = trpc.chamados.exportToExcel.useQuery(undefined, {
    enabled: false,
  });

  const filteredChamados = useMemo(() => {
    if (!chamados) return [];
    
    return chamados.filter((chamado) => {
      const matchesSearch = 
        chamado.numeroOS.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chamado.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chamado.nomeGT?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "todos" || chamado.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [chamados, searchTerm, statusFilter]);

  const calcularDias = (dataOS: Date | string) => {
    const data = new Date(dataOS);
    const hoje = new Date();
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

  const deleteMutation = trpc.chamados.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Chamado excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir chamado: " + error.message);
    },
  });
  
  const importMutation = trpc.chamados.importFromExcel.useMutation({
    onSuccess: (result) => {
      refetch();
      setUploadDialogOpen(false);
      setSelectedFile(null);
      toast.success(`Importação concluída! ${result.imported} chamados importados, ${result.failed} falharam.`);
    },
    onError: (error) => {
      toast.error("Erro ao importar planilha: " + error.message);
    },
  });

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      // Ler arquivo como base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        // Remover o prefixo "data:...,"
        const fileBase64 = base64.split(',')[1];
        
        importMutation.mutate({ fileBase64 });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Erro ao ler arquivo");
    }
  };

  const stats = useMemo(() => {
    if (!chamados) return { total: 0, abertos: 0, emAndamento: 0, fechados: 0 };
    
    return {
      total: chamados.length,
      abertos: chamados.filter(c => c.status === "aguardando_agendamento").length,
      emAndamento: chamados.filter(c => ['agendado', 'ag_retorno', 'atendido_ag_fechamento'].includes(c.status)).length,
      fechados: chamados.filter(c => c.status === "fechado").length,
    };
  }, [chamados]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chamados</h1>
            <p className="text-muted-foreground">
              Gerencie todos os chamados da Ecolab
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setLocation("/chamados/novo")}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Chamado
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const result = await exportExcel();
                if (result.data) {
                  const link = document.createElement('a');
                  link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data.fileBase64}`;
                  link.download = result.data.filename;
                  link.click();
                  toast.success('Planilha exportada com sucesso!');
                }
              }}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Exportar Excel'}
            </Button>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Importar Planilha
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Planilha Excel</DialogTitle>
                <DialogDescription>
                  Selecione um arquivo Excel (.xlsx) contendo os chamados para importar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo Excel</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>
                <Button 
                  onClick={handleFileUpload} 
                  disabled={!selectedFile || importMutation.isPending}
                  className="w-full"
                >
                  {importMutation.isPending ? "Importando..." : "Importar"}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abertos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.abertos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.emAndamento}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fechados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.fechados}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por OS, cliente ou técnico..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aguardando_agendamento">Aguardando agendamento</SelectItem>
                  <SelectItem value="agendado">Agendado - ag atendimento</SelectItem>
                  <SelectItem value="ag_retorno">Ag retorno</SelectItem>
                  <SelectItem value="atendido_ag_fechamento">Atendido - Ag fechamento</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de chamados */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Chamados</CardTitle>
            <CardDescription>
              {filteredChamados.length} chamado(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : filteredChamados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum chamado encontrado
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
              <TableHead>Nº OS</TableHead>
              <TableHead>Nº Tarefa</TableHead>
              <TableHead>Data OS</TableHead>
              <TableHead>Data Atend.</TableHead>
              <TableHead>Data Fech.</TableHead>
              <TableHead>Nº Dias</TableHead>
              <TableHead>Distrito</TableHead>
              <TableHead>Nome GT</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="max-w-xs">Observação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChamados.map((chamado) => (
                      <ChamadoRow
                        key={chamado.id}
                        chamado={chamado}
                        onUpdate={refetch}
                        onDelete={(id) => deleteMutation.mutate({ id })}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

