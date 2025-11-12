<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PdfDocument extends Model
{
    use HasFactory;

    /**
     * Los atributos que son asignables masivamente.
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'filename',
        'filename_second',
        'original_filename',
        'original_filename_second',
        'file_path',
        'file_path_second',
        'file_size',
        'file_size_second',
        'uploaded_by'
    ];

    /**
     * La relación con el usuario que subió el documento.
     */
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function views()
    {
        return $this->hasMany(PdfDocumentView::class);
    }
}