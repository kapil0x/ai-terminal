function calculateArea(length, width) {
    return length * width;
}

function getUserData(id) {
    // TODO: Add error handling
    const user = database.getUser(id);
    return user;
}

var total = 0;
for (var i = 0; i < items.length; i++) {
    total += items[i].price;
}

console.log("Total: " + total);