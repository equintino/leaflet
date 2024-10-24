import Controller from "../controllers/controller.js";
import Service from "../services/service.js";
import View from "../views/view.js";

const worker = new Worker('src/services/worker.js', {
    type: "module"
})
function featury() {
    Controller.initializer({
        view: new View(),
        service: new Service(),
        worker
    })
}

export default featury
