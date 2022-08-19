import {createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import roomService from './roomService'

//CREATE INITIAL STATE, GLOBAL VARIABLE, SAME TO VUEX
const initialState = {
    //Global
    globalSuccessMessage:'',
    globalErrorMessage:'',
    isLoadingPage:'',
}


export const getMyRooms = createAsyncThunk('room/get', async (user, thunkAPI) => {
    try {
        return await roomService.getMyRooms(user)
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

export const leaveRoom = createAsyncThunk('room/leave', async ({ roomID, username}, thunkAPI) => {
    try {
        return await roomService.leaveRoom(roomID, username)
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


export const deleteRoomById = createAsyncThunk('room/delete', async (_id, thunkAPI) => {
    try {
        return await roomService.deleteRoomById(_id)
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




export const roomSlice = createSlice({
    name:'room',
    initialState,
    reducers: {
        reset: state => {
            // CLear mo lang every variable sa state
        },

        setProps(state, action) {
            console.log(action.payload)
            //state = action.payload

            for (var key of Object.keys(state)) {
                console.log(key + " -> " + state[key])
                state[key] = action.payload[key]
            }
        },


        
    },


    extraReducers: builder => {
        // MGA MAY ASYNC NA NA COMMIT | pending | fulfilled | rejected
        builder
            .addCase(getMyRooms.pending, (state, action) => {
                state.loading = true
            })
            .addCase(getMyRooms.fulfilled, (state, { payload }) => {
                console.log(payload)
                state.globalSuccessMessage = payload.msg
            })
            .addCase(getMyRooms.rejected, (state, { payload }) => {
                state.globalErrorMessage = payload
            })

            // Leave Room
            .addCase(leaveRoom.pending, (state, action) => {
                state.isLoadingPage = 'Delete room please wait..'
            })
            .addCase(leaveRoom.fulfilled, (state, { payload }) => {
                console.log(payload)
                state.globalSuccessMessage = payload.msg
                state.isLoadingPage = ''
            })
            .addCase(leaveRoom.rejected, (state, { payload }) => {
                state.globalErrorMessage = payload
                state.isLoadingPage = ''
            })

            // Delete Room
            .addCase(deleteRoomById.pending, (state, action) => {
                state.isLoadingPage = 'Delete room please wait..'
            })
            .addCase(deleteRoomById.fulfilled, (state, { payload }) => {
                console.log(payload)
                state.globalSuccessMessage = payload.msg
                state.isLoadingPage = ''
            })
            .addCase(deleteRoomById.rejected, (state, { payload }) => {
                state.globalErrorMessage = payload
                state.isLoadingPage = ''
            })
    }
})



export const {
    setProps
} = roomSlice.actions
export default roomSlice.reducer