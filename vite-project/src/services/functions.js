import Swal from 'sweetalert2'
import { nextTick } from 'vue'

export function show_alerta (msj,icon,focus){
    if(focus != ''){
        nextTick(() => focus.value.focus());
    }
    Swal.fire({
        title: msj,
        icon: icon,
        buttonsStyling: true
    });

}

export function confirmation (name,url,redirect){
    Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esto!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, bórralo!'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire(
                'Borrado!',
                name + ' ha sido eliminado.',
                'success'
            );
            redirect(url);
        }
    });
}

