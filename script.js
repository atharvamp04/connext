Since you've completed CRUD, Sorting, and Search, the next feature is **Pagination**.

We'll show **5 students per page**.

---

## Step 1: Create global variables

At the top of your JS file:

```javascript
let currentPage = 1;
const rowsPerPage = 5;
```

---

## Step 2: Update `displayTable()`

Replace your current function with this logic.

```javascript
function displayTable(studentList) {

    let dataTable = document.querySelector(".data-table");

    let elements = "";

    let start = (currentPage - 1) * rowsPerPage;
    let end = start + rowsPerPage;

    let paginatedData = studentList.slice(start, end);

    paginatedData.forEach(record => {

        elements += `
        <tr>
            <td>${record.id}</td>
            <td>${record.firstName}</td>
            <td>${record.middleName}</td>
            <td>${record.lastName}</td>
            <td>${record.gender}</td>
            <td>${record.email}</td>
            <td>${record.mobile}</td>
            <td>${record.birthDate}</td>
            <td>${record.aboutMe}</td>
            <td>
                <button class="edit" onclick="editStudent(${record.id})">Edit</button>
                <button class="delete" onclick="deleteStudent(${record.id})">Delete</button>
            </td>
        </tr>
        `;
    });

    dataTable.innerHTML = elements;

    createPagination(studentList);
}
```

---

## Step 3: Add pagination container

Below your table in HTML:

```html
<div id="pagination"></div>
```

---

## Step 4: Pagination function

```javascript
function createPagination(studentList) {

    let totalPages = Math.ceil(studentList.length / rowsPerPage);

    let pagination = document.getElementById("pagination");

    let buttons = "";

    for (let i = 1; i <= totalPages; i++) {

        buttons += `
        <button onclick="changePage(${i})"
            ${i === currentPage ? "disabled" : ""}>
            ${i}
        </button>
        `;
    }

    pagination.innerHTML = buttons;
}
```

---

## Step 5: Change page

```javascript
function changePage(page) {

    currentPage = page;

    displayTable(data);

}
```

---

## Step 6: Reset to page 1 after adding/deleting/searching

Whenever you call

```javascript
displayTable(data);
```

before that write

```javascript
currentPage = 1;
```

Example:

```javascript
localStorage.setItem("object", JSON.stringify(data));

currentPage = 1;
readAll();
```

Similarly in `deleteStudent()`.

---

## Step 7: CSS

```css
#pagination{
    margin-top:20px;
    display:flex;
    justify-content:center;
    gap:10px;
}

#pagination button{
    padding:8px 14px;
    border:none;
    background:#4CAF50;
    color:white;
    cursor:pointer;
    border-radius:5px;
}

#pagination button:disabled{
    background:#999;
    cursor:not-allowed;
}
```

---

### Result

If you have:

* 3 records → **1 page**
* 8 records → **2 pages**
* 13 records → **3 pages**

Each page shows **only 5 rows**, and clicking **1, 2, 3...** switches between pages.

This is the standard client-side pagination approach used in many JavaScript CRUD applications.


Yes. A professional pagination should have:

```
← Previous   1 2 3 4   Next →
```

* ✅ Previous disabled on first page.
* ✅ Next disabled on last page.
* ✅ If there is only one page (or fewer than 5 rows), both Previous and Next are disabled.

Replace your `createPagination()` with this:

```javascript
function createPagination(studentList) {

    let totalPages = Math.ceil(studentList.length / rowsPerPage);

    let pagination = document.getElementById("pagination");

    let buttons = "";

    // Previous Button
    buttons += `
        <button
            onclick="changePage(currentPage - 1)"
            ${currentPage === 1 ? "disabled" : ""}>
            Previous
        </button>
    `;

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {

        buttons += `
            <button
                onclick="changePage(${i})"
                ${currentPage === i ? "disabled" : ""}>
                ${i}
            </button>
        `;
    }

    // Next Button
    buttons += `
        <button
            onclick="changePage(currentPage + 1)"
            ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}>
            Next
        </button>
    `;

    pagination.innerHTML = buttons;
}
```

---

Update `changePage()`:

```javascript
function changePage(page) {

    let totalPages = Math.ceil(data.length / rowsPerPage);

    if (page < 1 || page > totalPages) {
        return;
    }

    currentPage = page;

    displayTable(data);
}
```

---

### CSS

```css
#pagination{
    display:flex;
    justify-content:center;
    align-items:center;
    gap:8px;
    margin:20px 0;
}

#pagination button{
    padding:8px 14px;
    border:none;
    border-radius:6px;
    background:#28a745;
    color:white;
    cursor:pointer;
}

#pagination button:hover:not(:disabled){
    background:#218838;
}

#pagination button:disabled{
    background:#bdbdbd;
    cursor:not-allowed;
}
```

### Output

For **3 records**:

```
[Previous Disabled] [1 Disabled] [Next Disabled]
```

For **12 records**:

**Page 1**

```
[Previous Disabled] [1 Disabled] [2] [3] [Next]
```

**Page 2**

```
[Previous] [1] [2 Disabled] [3] [Next]
```

**Page 3**

```
[Previous] [1] [2] [3 Disabled] [Next Disabled]
```

This is the pagination style commonly used in professional CRUD applications.
