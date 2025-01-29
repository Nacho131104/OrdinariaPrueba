import type { APIvalidatePhone,APIworldtime,ContactModel } from "./types.ts";
import { Collection,ObjectId } from "mongodb";
import { GraphQLError } from "graphql";
import { isDocumentNode } from "../../../../AppData/Local/deno/npm/registry.npmjs.org/@graphql-tools/utils/9.2.1/typings/index.d.ts";


type contexto={
    ContactCollection: Collection<ContactModel>,
}

type argsGetContact ={
    id: string,
}

type argsAddContact={
    nombre: string,
    telefono: string,
}
type argsDeleteContact={
    id: string,
}

type argsUpdateContact={
    id: string,
    nombreyapellidos?:string,
    numero?:string,
}
export const resolvers ={
    Query:{
        getContact:async(_:unknown,args:argsGetContact,context:contexto): Promise<ContactModel|null> =>{
            return await context.ContactCollection.findOne({_id:new ObjectId(args.id)});
        },
        getContacts:async(_:unknown,__:unknown,ctx: contexto):Promise<ContactModel[]> =>{
            return await ctx.ContactCollection.find().toArray();
        },
    },

    Mutation:{
        addContact:async(_:unknown,args:argsAddContact,ctx:contexto):Promise<ContactModel> =>{
            const API_KEY = Deno.env.get("API_KEY");
            if(!API_KEY){throw new GraphQLError("Se necesita la calve de la api")};
            const{nombre,telefono} = args;
            const contactoExistente = await ctx.ContactCollection.findOne({telefono:telefono});
            if(contactoExistente){throw new GraphQLError("Este contacto ya exite")};
            const url = `//https://api.api-ninjas.com/v1/validatephone?number=${telefono}`;
            const data = await fetch(url,{
                headers:{
                    "X-API-KEY":API_KEY,
                }
            });

            const response :APIvalidatePhone =await data.json();
            if(!response.is_valid){throw new GraphQLError("Este telefono no es valido")};
            const pais = response.country;
            const timezone = response.timezone[0];
            const{insertedId} = await ctx.ContactCollection.insertOne({
                nombreYapellidos: nombre,
                telefono: telefono,
                pais: pais,
                timezone: timezone
            })
            return{
                _id:insertedId,
                nombreYapellidos: nombre,
                telefono:telefono,
                pais: pais,
                timezone:timezone,
            }

        },

        deleteContact:async(_:unknown, args:argsDeleteContact,ctx:contexto):Promise<boolean> =>{
            const{id} = args;
            const{deletedCount} = await ctx.ContactCollection.deleteOne({_id:new ObjectId(id)})
            return deletedCount ===1;
        },

        updateContact:async(_:unknown,args:argsUpdateContact,ctx:contexto):Promise<ContactModel> =>{
            const API_KEY = Deno.env.get("API-KEY");
            if(!API_KEY){throw new GraphQLError("Deberia haber una api key")};
            const{id,nombreyapellidos,numero} = args;

            if(!numero && !nombreyapellidos){
                throw new GraphQLError("Se necesita algun valor que modificar")
            }

            if(!numero){
                const newuser = await ctx.ContactCollection.findOneAndUpdate({_id: new ObjectId(id)},{$set:{nombreyapellidos}})
                if(!newuser){throw new GraphQLError("Contacto no existente")}
                return newuser;

            }
            const phoneExists = await ctx.ContactCollection.findOne({ numero });
            if (phoneExists && phoneExists._id.toString() !== id) throw new GraphQLError("Phone already taken by Diego");
            if(phoneExists){
                const newUser = await ctx.ContactCollection.findOneAndUpdate({
                    _id: new ObjectId(id)
                  }, {
                    $set: { nombreYapellidos: nombreyapellidos || phoneExists.nombreYapellidos }
                  });
                if (!newUser) throw new GraphQLError("User not found!");
                return newUser;
            }
            const url = `//https://api.api-ninjas.com/v1/validatephone?${numero}`
            const data = await fetch(url,{
                headers: {
                    "X-API-KEY":API_KEY,
                }
            });
            if (data.status !== 200) throw new GraphQLError("API Ninja Error");
            const response: APIvalidatePhone = await data.json();
            if(!response.is_valid){throw new GraphQLError("El telefono no es valido")};

            const pais = response.country;
            const timezone = response.timezone[0];
             const nuevoContact = await ctx.ContactCollection.findOneAndUpdate({
                _id: new ObjectId(id)
            },{
                nombreyapellidos,
                numero,
                pais,
                timezone,
            })
            if(!nuevoContact){throw new GraphQLError("Contacto no existente")}
            return nuevoContact;
        },
    },
    Contact:{
        id:(parent: ContactModel): string => parent._id!.toString(),
        hora:async(parent: ContactModel):Promise<string> =>{
            const API_KEY = Deno.env.get("API_KEY");
            if(!API_KEY){throw new GraphQLError("Se necesita una api key")};
            const timezone = parent.timezone;
            const url = `//https://api.api-ninjas.com/v1/worldtime?timezone=${timezone}`;
            const data = await fetch(url,{
                headers:{
                    "X-API-KEY":API_KEY,
                }
            })
            if(data.status!==200){throw new GraphQLError("Error en api ninja")};

            const response : APIworldtime = await data.json();
            return response.datetime;
        }
    }

}