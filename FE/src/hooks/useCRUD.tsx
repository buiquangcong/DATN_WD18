import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

const BASE_URL = "http://localhost:3000/api"

type ResourceType = "staff" | "bus" | "route" | "journey"

export const useDetail = (resource: ResourceType, id: string | undefined) => {
    const API = `${BASE_URL}/${resource}`
    return useQuery<any, Error>({
        queryKey: [resource, id],
        queryFn: async () => {
            const res = await axios.get(`${API}/${id}`)
            return res.data?.data ?? res.data
        },
        enabled: !!id
    })
}

export const useCRUD = (resource: ResourceType) => {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const API = `${BASE_URL}/${resource}`

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: [resource] })
    }

    const { data: list = [], isLoading, isError } = useQuery<any[], Error>({
        queryKey: [resource],
        queryFn: async () => {
            const res = await axios.get(API)
            return Array.isArray(res.data) ? res.data : res.data?.data || []
        }
    })

    const Add = useMutation({
        mutationFn: async (data: any) => {
            const res = await axios.post(`${API}/add`, data)
            return res.data
        },
        onSuccess: () => {
            refresh()
            toast.success("Thêm mới thành công")
            navigate(`/admin/${resource}/list`)
        },
        onError: () => {
            toast.error("Thêm mới thất bại")
        }
    })

    const Edit = useMutation({
        mutationFn: async (payload: any) => {
            const { _id, id, ...data } = payload
            const targetId = _id || id
            const res = await axios.put(`${API}/update/${targetId}`, data)
            return res.data
        },
        onSuccess: () => {
            refresh()
            toast.success("Cập nhật thành công")
            navigate(`/admin/${resource}/list`)
        },
        onError: () => {
            toast.error("Cập nhật thất bại")
        }
    })

    const Delete = useMutation({
        mutationFn: async (id: number | string) => {
            const res = await axios.delete(`${API}/delete/${id}`)
            return res.data
        },
        onSuccess: () => {
            refresh()
            toast.success("Xóa thành công")
        },
        onError: () => {
            toast.error("Xóa thất bại")
        }
    })

    return {
        list,
        isLoading,
        isError,
        Add: Add.mutate,
        Edit: Edit.mutate,
        Delete: Delete.mutate
    }
}