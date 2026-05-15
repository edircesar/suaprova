import React from 'react'
import { getGabarito } from '../../actions'
import { EditGabaritoForm } from './edit-form'
import { notFound } from 'next/navigation'

interface EditarGabaritoPageProps {
  params: {
    id: string
  }
}

export default async function EditarGabaritoPage({ params }: EditarGabaritoPageProps) {
  const { id } = params
  const gabarito = await getGabarito(id)

  if (!gabarito) {
    notFound()
  }

  return <EditGabaritoForm gabarito={gabarito} />
}
