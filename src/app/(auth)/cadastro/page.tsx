import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signup } from '../actions'

export default function CadastroPage() {
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-[5px] pt-0">
        <CardTitle className="text-3xl font-bold">Crie sua conta</CardTitle>
        <CardDescription className="text-base mt-2">
          Comece a automatizar a correção de suas provas hoje mesmo.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-[5px] mt-4">
        <form action={signup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" name="name" type="text" placeholder="João da Silva" required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="nome@exemplo.com" required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar senha</Label>
            <Input id="confirm-password" name="confirm-password" type="password" required className="h-11" />
          </div>
          <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white mt-6">
            Criar conta
          </Button>
        </form>
      </CardContent>
      <CardFooter className="px-[5px] mt-6 flex justify-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Fazer login
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
