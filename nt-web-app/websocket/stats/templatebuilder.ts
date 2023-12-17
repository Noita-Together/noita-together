export const templateHtml = `
<!DOCTYPE html>
<html lang="en">
<script type="text/javascript" src="chrome-extension://mdnleldcmiljblolnjhpnblkcekpdkpa/libs/customElements.js"
        class="__REQUESTLY__SCRIPT"></script>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>{room-name}</title>
    <style>.content {
        display: flex;
        align-content: center;
        flex-flow: column;
    }

    .header-custom {
        margin: auto;
    }

    body {
        background-color: black;
        color: rgba(255, 255, 238, 0.829);
    }

    table {
        border: 2px solid rgb(55, 46, 32);
        border-radius: 3px;
        background-color: rgb(55, 39, 36);
        margin: auto;
        /**/
    }

    th {
        background-color: rgb(55, 39, 36);
        color: rgba(255, 255, 255, 0.66);
        cursor: pointer;
        user-select: none;
    }

    tr {
        background-color: #242424;

    }

    tr:nth-child(even) {
        background-color: #4f4f4f;

    }

    th,
    td {
        min-width: 120px;
        padding: 10px 20px;
    }

    th.active {
        color: #fff;
    }

    th.active .arrow {
        opacity: 1;
    }

    .arrow {
        display: inline-block;
        vertical-align: middle;
        width: 0;
        height: 0;
        margin-left: 5px;
        opacity: 0.66;
    }

    .arrow.asc {
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 4px solid #fff;
    }

    .arrow.desc {
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid #fff;
    }</style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<div class="content">
    <div class="header-custom"><h1>Stats for {room-name}</h1></div>
    <table id="stats-table">
        <thead>
        <tr id="headers">
            {INSERT_HEADERS_HERE}
        </tr>
        </thead>
        <tbody>
        {INSERT_STATS_HERE}
        </tbody>
    </table>
</div>
</body>
<script>
    function sortTable(element, n) {
        var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
        table = document.getElementById("stats-table");
        switching = true;
        // Set the sorting direction to ascending:
        dir = "asc";
        /* Make a loop that will continue until
        no switching has been done: */
        while (switching) {
            // Start by saying: no switching is done:
            switching = false;
            rows = table.rows;
            /* Loop through all table rows (except the
            first, which contains table headers): */
            for (i = 1; i < (rows.length - 1); i++) {
                // Start by saying there should be no switching:
                shouldSwitch = false;
                /* Get the two elements you want to compare,
                one from current row and one from the next: */
                x = rows[i].getElementsByTagName("TD")[n];
                y = rows[i + 1].getElementsByTagName("TD")[n];

                var xValue = parseInt(x.innerHTML)
                var yValue = parseInt(y.innerHTML)
                if(isNaN(xValue) || isNaN(yValue)){
                    xValue = x.innerHTML.toLowerCase()
                    yValue = y.innerHTML.toLowerCase()
                }
                /* Check if the two rows should switch place,
                based on the direction, asc or desc: */
                if (dir === "asc") {
                    if (xValue > yValue) {
                        // If so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                } else if (dir === "desc") {
                    if (xValue < yValue) {
                        // If so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            }
            if (shouldSwitch) {
                /* If a switch has been marked, make the switch
                and mark that a switch has been done: */
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
                // Each time a switch is done, increase this count by 1:
                switchcount++;
            } else {
                /* If no switching has been done AND the direction is "asc",
                set the direction to "desc" and run the while loop again. */
                if (switchcount === 0 && dir === "asc") {
                    dir = "desc";
                    switching = true;
                }
            }
        }
        let children = document.getElementById('headers').children
        for(let child of children){
            child.className = '';
            document.getElementById(\`arrow\${child.id}\`).className = \`arrow asc\`
        }
        document.getElementById(\`arrow\${element.id}\`).className = \`arrow \${dir}\`
        element.className = 'active';
    }
</script>
</html>
`

export const buildColumn = (name: string, index: number) => {
    return `
    <th id="-${name}" class="" onclick="sortTable(this, ${index})">
        ${name}
        <span id="arrow-names" class="arrow asc"></span>
    </th>`
}

export const buildRow = (row: (string | number)[], index: number) => {
    const columns = row.map((row, index2) => `
        <td key='${index2}'>
            ${row}
        </td>
    `).join('\n')
    return ` 
        <tr key={${index}}>
            ${columns}
        </tr>
    `
}