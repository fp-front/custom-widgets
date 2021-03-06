<?php

/*
Widget Name: Video
Description: Video module
Author: Flying Pigs
Author URI: http://flyingpigs.es
*/

class Video_Widget extends SiteOrigin_Widget {
  function __construct() {
    //Here you can do any preparation required before calling the parent constructor, such as including additional files or initializing variables.

    //Call the parent constructor with the required arguments.
    parent::__construct (
      // The unique id for your widget.
      'video-widget',

      // The name of the widget for display purposes.
      'Video',

      // The $widget_options array, which is passed through to WP_Widget.
      // It has a couple of extras like the optional help URL, which should link to your sites help or support page.
      array(
        'description' => 'Video - Módulo de contenido',
        'panels_groups' => array('fp-widgets'),
        'panels_icon' => 'dashicons dashicons-admin-page'
      ),

      //The $control_options array, which is passed through to WP_Widget
      array(

      ),

      //The $form_options array, which describes the form fields used to configure SiteOrigin widgets.
      array(
        'section_main' => array(
          'type' => 'section',
          'label' => 'Textos del módulo:',
          'hide' => false,
          'fields' => array(
            'title' => array(
              'type' => 'text',
              'label' => 'Texto principal',
              'default' => '',
              'required' => true
            ),
            'text' => array(
              'type' => 'text',
              'label' => 'Entradilla',
              'default' => '',
              'optional' => true
            ),
          ),
        ),
        'section_video' => array(
          'type' => 'section',
          'label' => 'Video del módulo:',
          'hide' => false,
          'fields' => array(
            'video_size' => array(
              'type' => 'select',
              'label' => 'Elige ancho de vídeo centrado o completo',
              'default' => 'centered',
              'options' => array(
                'centered' => 'Centrado',
                'fullwidth' => 'Ancho completo',
              )
            ),
            'video_url' => array(
              'type' => 'text',
              'label' => 'Enlace del vídeo',
              'placeholder' => 'Por ejemplo, https://www.youtube.com/watch?v=XXXXXXXX o https://vimeo.com/XXXXXXXX',
              'default' => '',
              'required' => true
            ),
            'video_image' => array(
              'type'  => 'radio',
              'label' => '¿Qué imagen quieres para el vídeo?',
              'options' => array(
                'default_image' => 'Imagen por defecto',
                'custom_image' => 'Imagen personalizada'
              ),
              'default' => 'default_image',
              'state_emitter' => array(
                'callback' => 'select',
                'args' => array( 'video_image' )
              ),
            ),
            'image_url' => array(
              'type' => 'media',
              'label' => 'Imagen',
              'library' => 'image',
              'fallback' => true,
              'required' => true,
              'state_handler' => array(
                'video_image[default_image]' => array('hide'),
                'video_image[custom_image]' => array('show')
              )
            ),
          ),
        ),
      ),

      //The $base_folder path string.
      plugin_dir_path(__FILE__)
    );
  }

  function initialize() {
    $this->register_frontend_scripts(
      array(
        array(
          'video-widget',
          plugin_dir_url( __FILE__ ) . 'js/video-widget-scripts.js',
          array( 'jquery' ),
          '1.0'
        )
      )
    );
  }

  function get_template_variables($instance) {
    $vars = [];

    $vars['video_size'] = $instance['section_video']['video_size'];
    $vars['title'] = $instance['section_main']['title'];
    $vars['text'] = $instance['section_main']['text'];
    $vars['video_url'] = $instance['section_video']['video_url'];
    $vars['video_type'] = false;
    $vars['video_image'] = false;

    $video_code = '';

    if( strpos( $vars['video_url'] , 'youtube') != false ){
      $vars['video_type'] = 'youtube';
      $video_code = $this->getYoutubeId( $vars['video_url'] );
    }
    elseif ( strpos( $vars['video_url'] , 'vimeo') != false) {
      $vars['video_type'] = 'vimeo';
      $video_code = $this->getVimeoId( $vars['video_url'] );
    }
    else {
      $vars['video_url'] = false;
    }

    $vars['video_code'] = $video_code ;

    if( $instance['section_video']['video_image'] == 'custom_image' || $vars['video_type'] == false || $vars['video_url'] == false ){
      $vars['video_image']= $this->getImage( $instance['section_video']['image_url'], $instance['section_video']['image_url_fallback'] );
    }
    elseif ( $instance['section_video']['video_image'] == 'default_image' ) {
      if( $video_code != ''){
        if( $vars['video_type'] == 'youtube'){
          $vars['video_image'] = 'https://img.youtube.com/vi/'.$video_code.'/hqdefault.jpg';
        }
        elseif ($vars['video_type'] == 'vimeo'){
          $vars['video_image'] = $this->grab_vimeo_thumbnail( $vars['video_url'] );
        }
      }
    }

    return $vars;
  }

  function getImage( $image , $fallback = false ){
    $img = wp_get_attachment_image_src( $image , 'full', false );
    if( $img ) {
      return $img[0];
    } else {
      return $fallback;
    }
  }

  function grab_vimeo_thumbnail($vimeo_url){
    if( !$vimeo_url ) return false;

    $url = 'http://vimeo.com/api/oembed.json?url=' . rawurlencode($vimeo_url);
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_TIMEOUT, 30);
    curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1);

    $json = curl_exec($curl);
    curl_close($curl);

    $data = json_decode($json);

    if( !$data ) return false;
    return $data->thumbnail_url;
  }

  function getYoutubeId( $url ){
      if (preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i', $url, $match)) {
        $id = $match[1];
        if($id){
          return $id;
        } else {
          return '';
        }
    }
  }

  function getVimeoId( $url ){
      $regs = [];
      $id = '';

      if (preg_match('%^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$%im', $url, $regs)) {
          $id = $regs[3];
      }

      if($id){
        return $id;
      } else {
        return '';
      }
  }


  function get_template_name($instance) {
    return 'video-widget-template';
  }

  function get_style_name($instance) {
    return 'video-widget-style';

  }
}
siteorigin_widget_register('video-widget', __FILE__, 'Video_Widget');
