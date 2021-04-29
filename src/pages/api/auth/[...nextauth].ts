import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'
import { callbackify } from 'node:util'
import { signIn } from 'next-auth/client';

import { fauna } from '../../../services/fauna'
import { query as q } from 'faunadb'

export default NextAuth({
    //Configure one or more authentication providers
    providers:[
        Providers.GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            scope: 'read:user'
        }),
        
    ],
    callbacks: {
        async signIn(user, account, profile){
            const { email } = user

            try{
                //inserção no banco de dados FaunaDB
                await fauna.query(  
                    q.If(
                        q.Not(
                            q.Exists(
                                q.Match(
                                    q.Index('user_by_email'),
                                    q.Casefold(user.email)
                                )
                            )
                        ),
                        q.Create(
                            q.Collection('users'),
                            {data: { email }}
                        ),
                        q.Get(
                         q.Match(
                            q.Index('user_by_email'),
                            q.Casefold(user.email)
                        )
                    )
                )
                //se correr tudo bem, autenticação prossegue normalmente
                return true  
            } catch{
                //se der errado, vai dar um erro
                return false
            }

            
        }
    }
})