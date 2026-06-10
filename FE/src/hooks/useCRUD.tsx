import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"




const API = `http://localhost:3000/api/bus`

export const useCRUD = () => {
    const reload = useQueryClient()
    const navigate = useNavigate()

    const refresh = () => {
        reload.invalidateQueries({ queryKey: ['bus'] })
    }

    const { data: list = [], isLoading, isError } = useQuery<any[], Error>({
        queryKey: ['bus'],
        queryFn: async () => {
            const res = await axios.get(API)
            return res.data || []
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
            navigate("/admin/list")
        },
        onError: () => {
            toast.error("Thêm mới thất bại")
        }
    })
    

    return {
        list,
        isLoading,
        isError,
        Add: Add.mutate
    }
}