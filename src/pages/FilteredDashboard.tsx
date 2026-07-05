import { useParams } from 'react-router-dom'
import Dashboard from './Dashboard'

export default function FilteredDashboard() {
  const { categoryId } = useParams<{ categoryId: string }>()
  return <Dashboard baseCategoryId={categoryId ? Number(categoryId) : undefined} />
}
