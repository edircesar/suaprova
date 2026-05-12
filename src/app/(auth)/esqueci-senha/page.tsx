import Link from 'next/link'
import { resetPassword } from '../actions'

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Recuperar Senha</h1>
        <p className="text-slate-500">Digite seu e-mail para receber um link de redefinição.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 backdrop-blur-xl">
        <form action={resetPassword} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              E-mail cadastrado
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
          >
            Enviar link de recuperação
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Lembrou a senha?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium transition-colors">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
