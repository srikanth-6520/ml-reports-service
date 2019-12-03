 
 async function dateSorting() {
var obj = {
     response : [
         {
             id : 2,
             date : "2019-11-06T08:39:20.892000Z"
         },
         {
            id : 1,
            date : "2019-11-06T08:39:19.892000Z"
        }
     ]
}
let resp = await obj.response.sort(getSortOrder("date"))

 console.log(resp);

 }

function getSortOrder(prop) {
    return function(a, b) {
        if (a[prop] > b[prop]) {
            return 1;
        } else if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    }
 }

 dateSorting();
 