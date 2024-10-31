export function removePrefix(phoneNumber: string) {
    // Ensure the phone number is a string
    phoneNumber = phoneNumber.toString()

    // Remove any existing '+234' or '234' prefix and add 0
    return (phoneNumber = phoneNumber.replace(/^(\+234|234)/, '0'))
}

export const verifyAge = async (dob: Date) => {
    const enteredDate = new Date(dob)
    const today = new Date()

    // Calculate the date exactly 18 years ago from today
    const cutoffDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
    )

    // Check if cutoff date is greater than the entered date
    return cutoffDate > enteredDate
}

export const compareUserInfo = async (value: string, compareValue: string) =>
    value.toLocaleLowerCase() === compareValue.toLocaleLowerCase()
