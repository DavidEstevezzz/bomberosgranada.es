<?php

namespace App\Mail;

use App\Models\Request;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RequestStatusUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $miRequest;
    public $newEstado;

    public function __construct($miRequest, $newEstado)
    {
        $this->miRequest = $miRequest;
        $this->newEstado = $newEstado;
    }

    public function build()
    {
        return $this->subject('Actualización del estado de tu solicitud')
            ->view('emails.request_status_updated')
            ->with([
                'nombreUsuario' => $this->miRequest->EnviadaPor->nombre,
                'estado' => $this->newEstado,
                'tipo' => $this->miRequest->tipo,
                'fechaIni' => $this->miRequest->fecha_ini,
                'fechaFin' => $this->miRequest->fecha_fin,
            ]);
    }
}
