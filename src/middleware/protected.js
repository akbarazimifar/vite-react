import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
export default (user, element) => {
    const navigate = useNavigate()
    if(user) {
        return element
    } else {
        useEffect(() => {
            navigate('/')
        }, [user])
    }
    
}