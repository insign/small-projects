import { api } from 'src/boot/axios'
import type { Task, Settings } from 'src/types'
import axios from 'axios'

interface VersionResponse {
  id: string
  version: number
}

interface DataResponse {
  id: string
  version: number
  json: Task[] | Settings
}

export function useApi() {
  const getVersion = async (id: string): Promise<number> => {
    try {
      const response = await api.get<VersionResponse>(`/${id}/version`)
      return response.data.version
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
        return 0 // Not found on remote, so version is 0
      }
      console.error(`Error fetching version for ${id}:`, error)
      throw error
    }
  }

  const getData = async (id: string): Promise<DataResponse | null> => {
    try {
      const response = await api.get<DataResponse>(`/${id}`)
      return response.data
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
        return null
      }
      console.error(`Error fetching data for ${id}:`, error)
      throw error
    }
  }

  const putData = async (id: string, data: Task[] | Settings): Promise<DataResponse> => {
    try {
      // The API expects the content directly, not nested under a 'json' key
      const response = await api.put<DataResponse>(`/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`Error putting data for ${id}:`, error)
      throw error
    }
  }

  return {
    getVersion,
    getData,
    putData,
  }
}