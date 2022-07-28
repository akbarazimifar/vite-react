import {createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import userService from './userService'


//Get user if loggedIN
const user = JSON.parse(localStorage.getItem('user'))

//CREATE INITIAL STATE, GLOBAL VARIABLE, SAME TO VUEX
const initialState = {
    loading: false,
    message:'',
    user: user ? user : null,
    //Login
    loginMessage:'',
    loginLoading:false,
}


export const insertUser = createAsyncThunk('user/insert', async (newuser, thunkAPI) => {
    try {
        const res = await userService.insertUser(newuser)
        return res.data
    } catch (err) {
        console.log(err)
        const message = (
            err.response &&
            err.response.data &&
            err.response.data.message
        ) || err.message || err.toString()

        return thunkAPI.rejectWithValue(message)
    }
})

export const login = createAsyncThunk('user/login', async (user, thunkAPI) => {
    try {
        const res = await userService.login(user)
        return res.data
    } catch (err) {
        console.log(err)
        const message = (
            err.response &&
            err.response.data &&
            err.response.data.message
        ) || err.message || err.toString()

        return thunkAPI.rejectWithValue(message)
    }
})



export const userSlice = createSlice({
    name:'user',
    initialState,
    reducers: {
        reset: state => {
            // CLear mo lang every variable sa state
        },

        setSomething: (state, action) => {
            // action.payload = data na pinasa mo parang sa $store.commit('setSomething', payload)
        },
        
        setMessage(state, action) {
            console.error(action.payload)
            state.message = action.payload
        },
        
        setProps(state, action) {
            console.log(action.payload)
            //state = action.payload

            for (var key of Object.keys(state)) {
                console.log(key + " -> " + state[key])
                state[key] = action.payload[key]
            }
        },


        logout(state, action) {
            state.user = null 
            localStorage.setItem('user', null)
        }

        
    },


    extraReducers: builder => {
        // MGA MAY ASYNC NA NA COMMIT | pending | fulfilled | rejected
        builder
            .addCase(insertUser.pending, (state, action) => {
                state.loading = true
            })
            .addCase(insertUser.fulfilled, (state, action) => {
                console.log(action.payload)
                state.loading = false
            })
            .addCase(insertUser.rejected, (state, action) => {
                state.message = action.payload
                state.loading = false
            })


            //Login
            .addCase(login.pending, (state, action) => {
                state.loginLoading = true
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loginLoading = false
                if(action.payload) {
                    localStorage.setItem('user', JSON.stringify(action.payload))
                    state.user = action.payload
                    console.log(action.payload)
                    window.location.href='/lobby'
                }
                
            })
            .addCase(login.rejected, (state, action) => {
                state.loginMessage = action.payload
                state.loginLoading = false
                console.log(action.payload)
            })
    }
})



export const {
    reset, 
    setSomething,
    setMessage,
    setProps,
    logout
} = userSlice.actions
export default userSlice.reducer