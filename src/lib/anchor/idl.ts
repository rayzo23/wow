// Import anchor types
import * as anchor from '@project-serum/anchor';

// This IDL matches the Anchor program we created
export const IDL = {
  version: "0.1.0",
  name: "wall_of_wish",
  instructions: [
    {
      name: "submitWish",
      accounts: [
        {
          name: "wish",
          isMut: true,
          isSigner: false
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "title",
          type: "string"
        }
      ]
    },
    {
      name: "deleteWish",
      accounts: [
        {
          name: "wish",
          isMut: true,
          isSigner: false
        },
        {
          name: "user",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "title",
          type: "string"
        }
      ]
    }
  ],
  accounts: [
    {
      name: "aWish",
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "publicKey"
          },
          {
            name: "title",
            type: "string"
          }
        ]
      }
    }
  ],
  errors: []
} as anchor.Idl;

// Program ID should match what's in the Anchor program
// Successfully deployed to devnet on April 21, 2025
export const PROGRAM_ID = "7T8HaWzjMumQLMKxMQNJDsxJUGe8fzbWxVwUvkC7VVaC";
