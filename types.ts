import{OptionalId }from "mongodb"



export type ContactModel = OptionalId<{
    nombreYapellidos: string,
    telefono: string,
    pais: string,
    hora: string,
}>


//https://api.api-ninjas.com/v1/validatephone
export type APIvalidatePhone ={
    is_valid: boolean,
    country: string,
    timezone: string[],
};

//https://api.api-ninjas.com/v1/worldtime
export type APIworldtime={
    datetime: string,
}

