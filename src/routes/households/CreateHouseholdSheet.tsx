import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createHousehold } from '@/lib/api/households'
import { ApiError } from '@/lib/api/client'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField } from '@/components/ui/Field'
import { toast } from '@/lib/toast'
import { useIsMounted } from '@/lib/useIsMounted'

const TYPE_SUGGESTIONS = ['Bachelor Mess', 'Family Home', 'Shared Flat']

export function CreateHouseholdSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isMounted = useIsMounted()
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: () => createHousehold({ name, type: type || undefined, description: description || undefined }),
    onSuccess: (household) => {
      queryClient.invalidateQueries({ queryKey: ['households'] })
      toast.success('Household created')
      onClose()
      if (isMounted.current) navigate(`/h/${household.id}`)
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errors) {
        setErrors({ name: err.fieldError('name') ?? '' })
      } else {
        toast.error(err instanceof Error ? err.message : 'Could not create household')
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    mutation.mutate()
  }

  return (
    <Sheet open={open} onClose={onClose} title="New household">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <InputField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          autoFocus
        />
        <InputField
          label="Type"
          list="household-type-suggestions"
          value={type}
          onChange={(e) => setType(e.target.value)}
          hint="e.g. Bachelor Mess, Family Home"
        />
        <datalist id="household-type-suggestions">
          {TYPE_SUGGESTIONS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <InputField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button type="submit" isLoading={mutation.isPending} className="mt-2 w-full">
          Create
        </Button>
      </form>
    </Sheet>
  )
}
