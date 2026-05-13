'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from '../actions'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    
    try {
      await login(formData)
      // O redirect acontece dentro da action, então o código aqui raramente continuará
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Falha ao entrar. Verifique seu e-mail e senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-[5px] pt-0">
        <CardTitle className="text-3xl font-bold">Bem-vindo de volta</CardTitle>
        <CardDescription className="text-base mt-2">
          Insira suas credenciais para acessar sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-[5px] mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" required className="h-11" disabled={loading} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link href="/esqueci-senha" tabIndex={-1} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Esqueceu a senha?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required className="h-11" disabled={loading} />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white mt-4" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="px-[5px] mt-6 flex justify-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Ainda não tem uma conta?{' '}
          <Link href="/cadastro" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Criar conta
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
