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
            await axios.post(`${API}/add`, data)
        },
        onSuccess: () => {
            refresh()
            toast.success("Thêm thành công")
            navigate('/admin/list')
        },
        onError: () => { toast.error("Thêm thất bại") }
    })

    // 2. Hàm Edit sửa thành: ${API}/update/${id}
    const Edit = useMutation({
        mutationFn: async (payload: any) => {
            const { id, ...data } = payload
            await axios.put(`${API}/update/${id}`, data)
        },
        onSuccess: () => {
            refresh()
            toast.success("Cập nhật thành công")
            navigate('/admin/list')
        },
        onError: () => { toast.error("Cập nhật thất bại") }
    })

    // 3. Hàm Delete sửa thành: ${API}/delete/${id}
    const Delete = useMutation({
        mutationFn: async (id: number | string) => {
            await axios.delete(`${API}/delete/${id}`)
        },
        onSuccess: () => {
            refresh()
            toast.success("Xóa thành công")
        },
        onError: () => { toast.error("Xóa thất bại") }
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