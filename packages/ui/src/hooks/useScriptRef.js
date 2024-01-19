import { useEffect, useRef } from 'react'

// ==============================|| ELEMENT REFERENCE HOOKS  ||============================== //

const useScriptRef = () => {
    const scripted = useRef(true)

    // useEffect(
    //     () => () => {
    //         scripted.current = false
    //         console.log('useScriptRef.js: scripted.current = false')
    //     },
    //     []
    // )

    useEffect(() => {
        //onMount
        scripted.current = true
        return () => {
            //onUnMount
            scripted.current = false
        }
    }, [])

    return scripted
}

export default useScriptRef
