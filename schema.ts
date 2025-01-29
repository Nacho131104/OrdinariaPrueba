export const schema = `#graphql 
    type Contact {
        id: ID!
        nombreyApellidos: String!
        telefono: String!
        pais: String!
        hora: String!
    }

    type Query {
        getContact(id: ID!): Contact
        getContacts: [Contact!]!
    }

    type Mutation{
        addContact(nombreYapellidos: String!, numero: String!): Contact!
        updateContact(id: ID!, nombreYapellidos: String, numero: String): Contact!
        deleteContact(id:ID!): Boolean!
    }
`;