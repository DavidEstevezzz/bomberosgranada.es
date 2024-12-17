<?php

namespace App\Mail;

use App\Models\ShiftChangeRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ShiftChangeStatusUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $shiftChangeRequest;
    public $newEstado;

    public function __construct(ShiftChangeRequest $shiftChangeRequest, $newEstado)
    {
        $this->shiftChangeRequest = $shiftChangeRequest;
        $this->newEstado = $newEstado;
    }

    public function build()
    {
        return $this->subject('Actualización del cambio de guardia')
            ->view('emails.shift_change_status_updated')
            ->with([
                'empleado1' => $this->shiftChangeRequest->empleado1->nombre,
                'empleado2' => $this->shiftChangeRequest->empleado2->nombre,
                'estado' => $this->newEstado,
                'fecha' => $this->shiftChangeRequest->fecha,
                'turno' => $this->shiftChangeRequest->turno,
            ]);
    }
}
