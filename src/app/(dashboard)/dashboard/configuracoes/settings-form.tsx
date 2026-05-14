'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  User, 
  Lock, 
  ShieldCheck, 
  CreditCard, 
  Bell, 
  Trash2, 
  Loader2,
  CheckCircle
} from 'lucide-react'
import { updateProfile, changePassword } from './actions'

interface SettingsFormProps {
  user: {
    email?: string
    fullName?: string
    credits?: number
  }
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  
  const [fullName, setFullName] = useState(user.fullName || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    
    const formData = new FormData()
    formData.append('fullName', fullName)
    
    try {
      const result = await updateProfile(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Perfil atualizado com sucesso!')
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('As senhas não conferem')
      return
    }

    setIsUpdatingPassword(true)
    const formData = new FormData()
    formData.append('password', password)
    formData.append('confirmPassword', confirmPassword)

    try {
      const result = await changePassword(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Senha alterada com sucesso!')
        setPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      toast.error('Erro ao alterar senha')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna da Esquerda: Navegação rápida e Info */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
          <CardContent className="relative pt-12 text-center">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-3xl font-bold">
              {user.fullName?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{fullName || 'Usuário'}</h3>
            <p className="text-sm text-slate-500">{user.email}</p>
            
            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-around">
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Créditos</p>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{user.credits || 0}</p>
              </div>
              <div className="w-px bg-slate-200 dark:bg-slate-800"></div>
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Status</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">Ativo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="hidden lg:block space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold text-sm">
            <User size={18} />
            Perfil e Conta
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900 font-medium text-sm">
            <Lock size={18} />
            Segurança
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900 font-medium text-sm">
            <Bell size={18} />
            Notificações
          </button>
        </div>
      </div>

      {/* Coluna da Direita: Formulários */}
      <div className="lg:col-span-2 space-y-8">
        {/* Seção de Perfil */}
        <section id="profile">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} className="text-indigo-600" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>Atualize seu nome de exibição e dados básicos.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input 
                    id="fullName" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo" 
                    className="max-w-md"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    value={user.email} 
                    disabled 
                    className="max-w-md bg-slate-50 dark:bg-slate-900 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400">O e-mail não pode ser alterado por aqui por questões de segurança.</p>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/50 py-3">
                <Button type="submit" disabled={isUpdatingProfile} className="bg-indigo-600 hover:bg-indigo-700 h-9 px-6 rounded-lg">
                  {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle size={16} className="mr-2" />}
                  Salvar Mudanças
                </Button>
              </CardFooter>
            </form>
          </Card>
        </section>

        {/* Seção de Segurança */}
        <section id="security">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock size={20} className="text-indigo-600" />
                Alterar Senha
              </CardTitle>
              <CardDescription>Escolha uma senha forte para proteger sua conta.</CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="max-w-md"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/50 py-3">
                <Button type="submit" disabled={isUpdatingPassword} className="bg-slate-900 dark:bg-slate-50 h-9 px-6 rounded-lg">
                  {isUpdatingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck size={16} className="mr-2" />}
                  Redefinir Senha
                </Button>
              </CardFooter>
            </form>
          </Card>
        </section>

        {/* Zona de Perigo */}
        <section id="danger">
          <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-900/5">
            <CardHeader>
              <CardTitle className="text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Trash2 size={20} />
                Zona de Perigo
              </CardTitle>
              <CardDescription>Ações irreversíveis relacionadas à sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Excluir Conta</p>
                  <p className="text-xs text-slate-500">
                    Ao excluir sua conta, todos os seus gabaritos, correções e créditos serão apagados permanentemente.
                  </p>
                </div>
                <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white transition-colors">
                  Excluir Permanentemente
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
