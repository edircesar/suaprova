'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Printer, 
  FileText,
  Loader2
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteGabarito, renameGabarito } from './actions'
import Link from 'next/link'

interface GabaritoActionsProps {
  gabarito: {
    id: string
    nome: string
  }
}

export function GabaritoActions({ gabarito }: GabaritoActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [novoNome, setNovoNome] = useState(gabarito.nome)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteGabarito(gabarito.id)
      if (result?.error) {
        toast.error(`Erro ao excluir: ${result.error}`)
      } else {
        toast.success('Gabarito excluído com sucesso!')
        setShowDeleteDialog(false)
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao excluir o gabarito.')
      console.error('Erro ao deletar:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRename = async () => {
    if (!novoNome.trim() || novoNome === gabarito.nome) {
      setShowRenameDialog(false)
      return
    }

    setIsRenaming(true)
    try {
      const result = await renameGabarito(gabarito.id, novoNome)
      if (result?.error) {
        toast.error(`Erro ao renomear: ${result.error}`)
      } else {
        toast.success('Gabarito renomeado com sucesso!')
        setShowRenameDialog(false)
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao renomear o gabarito.')
      console.error('Erro ao renomear:', error)
    } finally {
      setIsRenaming(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Link 
          href={`/dashboard/provas/${gabarito.id}/folha`}
          className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-1.5 rounded-md transition-colors"
          title="Imprimir Folha"
        >
          <Printer size={18} />
        </Link>
        <Link 
          href={`/dashboard/provas/${gabarito.id}/relatorio`}
          className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-1.5 rounded-md transition-colors"
          title="Ver Relatório"
        >
          <FileText size={18} />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal size={18} />
            </Button>
          } />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowRenameDialog(true)} className="cursor-pointer">
              <Pencil size={14} className="mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)} 
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <Trash2 size={14} className="mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialog de Renomear */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Renomear Gabarito</DialogTitle>
            <DialogDescription>
              Digite o novo nome para esta prova.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Prova</Label>
              <Input
                id="name"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRename} disabled={isRenaming}>
              {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Excluir */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o gabarito
              "<strong>{gabarito.nome}</strong>" e todos os dados relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
