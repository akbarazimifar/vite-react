import React, { useCallback, useState } from 'react'
import {Link} from 'react-router-dom'
const login = ({submitLogin, isLoading}) => {

    const submit = (e) => {
        e.preventDefault()
        submitLogin(getForm)
    }

    const [getForm, setForm] = useState({
        username:'',
        password:''
    })

    return (
        <form  onSubmit={submit} className={`border-4 border-purple-500 p-5 w-1/2 m-auto my-5 font-mono  ${isLoading ? 'breathing-effect' : ''}`}>
            <h1 className='text-2xl text-purple-700 font-bold'>Welcome to login</h1>
            <small className="text-gray-500">
                Video Conference
            </small>
            <div>
                <input onChange={e => setForm({...getForm, [e.target.name]: e.target.value})} type="text" className="border p-2 w-full font-mono text-purple-800 focus:bg-purple-200 my-3" placeholder="Username" name="username"/>
                <input onChange={e => setForm({...getForm, [e.target.name]: e.target.value})} type="password" className="border p-2 w-full font-mono text-purple-800 focus:bg-purple-200" placeholder="Username" name="password"/>
            </div>

            <div className="text-right mt-3">
                <button className="bg-purple-700 px-3 py-1 rounded text-white  font-mono">
                    LOGIN
                </button>

                <Link to="/register" className="border-purple-700 px-3 py-1 rounded text-purple-700  font-mono">
                    REGISTER
                </Link>
            </div>
        </form>
    )
}

export default React.memo(login)