const CapitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

export { CapitalizeWords };