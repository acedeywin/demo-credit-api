import { AccountDto } from './account.types'

export enum VerificationStatus {
    UNVERIFIED = 'unverified',
    VERIFIED = 'verified',
    FAILED = 'failed',
}

export interface UserDto {
    id?: string
    first_name: string
    last_name: string
    email: string
    password: string
    phone_number: string
    dob: Date
    nin?: number
    email_verified?: boolean
    nin_verified: VerificationStatus
}

export interface UserAccountResponse {
    user: UserDto
    account: AccountDto
}
