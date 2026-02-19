import { formatDistance } from 'date-fns'

export const formatDate = (date: Date) => {
  return formatDistance(date, new Date(), { addSuffix: true })
}
