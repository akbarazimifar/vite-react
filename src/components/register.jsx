import React, { useCallback, useState } from 'react'

const login = ({onSubmit}) => {

    const submitRegister = useCallback(async (e) => {
        e.preventDefault()

        if(getForm.password != getForm.password1 || getForm.password == '' || getForm.password1 == '') {
            alert("Confirm password")
        } else {
            let newuser = getForm
            delete newuser['password1']
            onSubmit(newuser)
        }
    })

    const [getForm, setForm] = useState({
        username:'',
        password:'',
        password1:'',
        fname:'',
        lname:'',
    })

    return (
        <form onSubmit={submitRegister} className="border p-5 bg-white  w-1/2 md:w-1/3 xm:w-full m-auto my-5 font-mono">
            <h1 className='text-2xl text-purple-700 font-bold'>Register Account</h1>
            <small className="text-gray-500">
                Video Conference
            </small>
            <div>

                <small className='text-sm text-purple-700'>
                    Account information
                </small>

                <input onChange={e => setForm({...getForm, [e.target.name]: e.target.value})} type="text" className="border p-2 w-full font-mono text-purple-800 focus:bg-purple-200" placeholder="Username" name="username"/>
                <input onChange={e => setForm({...getForm, [e.target.name]: e.target.value})} type="password" className="mt-3 border p-2 w-full font-mono text-purple-800 focus:bg-purple-200" placeholder="Password" name="password1"/>
                <input onChange={e => setForm({...getForm, [e.target.name]: e.target.value})} type="password" className={`my-3 border p-2 w-full font-mono text-purple-800 focus:${getForm.password1 !== getForm.password ? 'bg-red-700' : 'bg-purple-200'}`} placeholder="Confirm password" name="password"/>
                
                <small className='text-sm text-purple-700'>
                    Profile information
                </small>
                <input onChange={e => setForm({...getForm, [e.target.name]: e.target.value})} type="text" className="border p-2 w-full font-mono text-purple-800 focus:bg-purple-200 " placeholder="First name" name="fname"/>
                <input onChange={e => setForm({...getForm, [e.target.name]: e.target.value})} type="text" className="my-3 border p-2 w-full font-mono text-purple-800 focus:bg-purple-200" placeholder="Last name" name="lname"/>
            </div>

            <div className="text-right mt-3">
                <button type='submit' className="bg-purple-700 px-3 py-1 rounded text-white  font-mono">
                    Submit
                </button>
            </div>
        </form>
    )
}

export default login