const ISANToWebGL = (oldPos) => {
    // noinspection JSSuspiciousNameCombination
    let x = oldPos.y;
    let y = oldPos.z;
    let z = oldPos.x;
    return {x,y,z};
}

const WebGLToISAN = (oldPos) => {
    let x = oldPos.z;
    // noinspection JSSuspiciousNameCombination
    let y = oldPos.x;
    let z = oldPos.y;
    return {x,y,z};
}

const ISANToSenkii = (oldPos) => {
    let x = oldPos.x;
    let y = oldPos.y;
    let z = oldPos.z;
    return {x,y,z};
}

const SenkiiToISAN = (oldPos) => {
    let x = oldPos.x;
    let y = oldPos.y;
    let z = oldPos.z;
    return {x,y,z};
}

const convert = (oldSystemName, newSystemName, coords) => {
    const systems = [
        {
            name: "Senkii",
            toISAN: SenkiiToISAN,
            fromISAN: ISANToSenkii
        },
        {
            name: "WebGL",
            toISAN: WebGLToISAN,
            fromISAN: ISANToWebGL
        },
        {
            // Essentially redundant but included for simplicity.
            // Also removes the need for an edge case in conditionals.
            name: "ISAN",
            toISAN: ({x,y,z})=>({x,y,z}),
            fromISAN: ({x,y,z})=>({x,y,z})
        }
    ]
    const validSystems = systems.map(s=>s.name);
    if(validSystems.includes(oldSystemName) && validSystems.includes(newSystemName)){
        let oldSystem = systems.find(s=>s.name===oldSystemName);
        let newSystem = systems.find(s=>s.name===newSystemName);
        return newSystem.fromISAN(oldSystem.toISAN(coords));

    }else{
        return Error(`Invalid system/s supplied. Must be one of: ${validSystems.join(', ')}`);
    }
}

module.exports =  {ISANToWebGL, WebGLToISAN, ISANToSenkii, SenkiiToISAN, convert}