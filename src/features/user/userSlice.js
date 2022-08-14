import {createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import userService from './userService'


//Get user if loggedIN
//localStorage.setItem('user', null)
const user = JSON.parse(localStorage.getItem('user'))

//CREATE INITIAL STATE, GLOBAL VARIABLE, SAME TO VUEX
const initialState = {
    user: user ? user : null,
    loading: false,
    message:'',

    //Global
    globalSuccessMessage:'',
    globalErrorMessage:'',
    isLoadingPage:'',
    
    //Login
    loginMessage:'',
    loginLoading:false,

    //Register
    isRegistered:false,

    //Invite
    invitingMe:''
}


export const insertUser = createAsyncThunk('user/insert', async (newuser, thunkAPI) => {
    try {
        return await userService.insertUser(newuser)
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
        return await userService.login(user)
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
            .addCase(insertUser.fulfilled, (state, { payload }) => {
                console.log(payload)
                state.globalSuccessMessage = payload.msg
                state.isRegistered = true
            })
            .addCase(insertUser.rejected, (state, { payload }) => {
                state.globalErrorMessage = payload
                state.isRegistered = false
            })

            //Login
            .addCase(login.pending, (state, action) => {
                state.loginLoading = true
            })
            .addCase(login.fulfilled, (state, { payload }) => {
                state.loginLoading = false
                localStorage.setItem('user', JSON.stringify(payload))
                state.user = payload
                console.log(payload)
            })
            .addCase(login.rejected, (state, { payload }) => {
                // Payload will be direct string becase its no response from server
                state.globalErrorMessage = payload
                state.loginLoading = false
                console.log(payload)
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