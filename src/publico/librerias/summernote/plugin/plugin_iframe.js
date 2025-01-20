 (function (factory) {
     if (typeof define === 'function' && define.amd) {
         // AMD. Register as an anonymous module.
         define(['jquery'], factory);
     } else if (typeof module === 'object' && module.exports) {
         // Node/CommonJS
         module.exports = factory(require('jquery'));
     } else {
         // Browser globals
         factory(window.jQuery);
     }
 }(function ($) {
     // Extends plugins for adding hello.
     //  - plugin is external module for customizing.
     $.extend($.summernote.plugins, {
         /**
          * @param {Object} context - context object has status of editor.
          */
         'iframe': function (context) {
             var self = this;

             // ui has renders to build ui elements.
             //  - you can create a button with `ui.button`
             var ui = $.summernote.ui;
             var dom = $.summernote.dom;

             var $editor = context.layoutInfo.editor;
             var currentEditing = null;
             var options = context.options;
             var lang = options.langInfo;

             // add context menu button
             context.memo('button.iframe', function () {
                 return ui.button({
                     contents: '<i class="note-icon-frame"/>',
                     tooltip: lang.iframe.iframe,
                     click: (event) => {
                         currentEditing = null;
                         context.createInvokeHandler('iframe.show')(event);

                     }
                 }).render();
             });



             // This events will be attached when editor is initialized.
             this.events = {
                 // This will be called after modules are initialized.
                 'summernote.init': function (we, e) {
                     $('data.ext-iframe', e.editable).each(function () {
                         self.setContent($(this));
                     });
                 },

             };

             // This method will be called when editor is initialized by $('..').summernote();
             // You can create elements for plugin
             this.initialize = function () {
                 var $container = options.dialogsInBody ? $(document.body) : $editor;

                 var body = `<div class="note-modal-header">
        <button type="button" class="close" aria-label="Close" aria-hidden="true"><i class="note-icon-close"></i></button>
        <h4 class="note-modal-title">Insertar Código HTML</h4>
    </div>
    <div class="form-group row-fluid">
        <label>${lang.iframe.title}</label>
        <input class="ext-iframe-title form-control" type="text" />       
       
        <hr>
        <table style="border:node; background: #141d2b; width:100%; margin-bottom: 10px;">
            <tr>
                <td style="width: 10%; ">
                    <button type="button" class="btn btn-outline-warning" id="refreIframe"><i class="fa-solid fa-retweet"></i></button>
                </td>
                <td style="width: 18%; color: #A4B1cd; padding: 2px 20px;">Búsqueda de Código</td>
                <td style="width: 45%; ">
                    <select id="cboCodePrism" class="select2 form-control custom-select" style="width: 100%; color: #A4B1cd !important; background: #293b56">
                        <option value="0">Seleccione Código a Insertar...</option>
                    </select>
                </td>
                <td style="width: 15%; color: #A4B1cd; padding: 2px 20px;">Excel a HTML</td>
                <td style="width: 10%; ">
                    <button type="button" class="btn btn-outline-warning" id="convert"><i class="fa-solid fa-file-csv"></i> &nbsp; &nbsp;<i class="fa-solid fa-arrow-right-long"></i> &nbsp; &nbsp;<i class="fa-brands fa-html5"></i></button>
                </td>
                
            </tr>
        </table>
        <div class="mb-3" style=" margin-top: 7px;">
            <textarea class="form-control" rows="14" id="inney" style="font-family: monospace;" placeholder="Copiar desde Excel..." ></textarea>
        </div>
        
        <div class="mb-3" style=" margin-top: 7px;">
            <label for="exampleFormControlTextarea1" class="form-label">${lang.iframe.url}</label>
             <textarea class="ext-iframe-url form-control" rows="7" id="iframe_insert"  placeholder="Resultado Código HTML..."></textarea>
        </div>
    </div>`;
                 var footer = '<button href="#" class="btn btn-primary ext-iframe-btn disabled" disabled style="margin-bottom: 10px;">' + lang.iframe.insertOrUpdate + '</button>';

                 this.$dialog = ui.dialog({
                     title: lang.iframe.insert,
                     fade: options.dialogsFade,
                     body: body,
                     footer: footer
                 }).render().appendTo($container);


             };

             // This methods will be called when editor is destroyed by $('..').summernote('destroy');
             // You should remove elements on `initialize`.
             this.destroy = function () {
                 ui.hideDialog(this.$dialog);
                 this.$dialog.remove();
             };

             this.createIframeNode = function (data) {
                 var $iframeSubst = $(
                     '<div class="test">' + data.url + '</div><p>x</p>'
                 );

                 $iframeSubst.attr("name", "agregado").attr("data-title", data.title);
                 return $iframeSubst[0];
             };

             $('#convert').click(function () {
                 x = $('#inney').val();
                 x = x.split('\t').join('</td><td>');
                 x = x.split('\n').join('</td></tr><tr><td>');
                 x = '<table class="tablaPentUni"><tr><td>' + x + '</td></tr></table>';
                 // $('#output').text(x).focus().select();
                 // $('#render').html(x);
                 $("#iframe_insert").val(x).focus();
             });
             let listaCode = [

                 {
                     "Id": "51",
                     "Nombre": "Comando Usuario",
                     "Code": '<pre class="command-line language-bash" data-user="root" data-host="Target"  data-output="2-100"><code>|</code></pre>'
                     },
                 {
                     "Id": "52",
                     "Nombre": "Comando Modificable",
                     "Code": '<pre class="command-line language-powershell" data-prompt="C:\\Users\\user>" data-output="2-100"><code>|</code></pre>'
                     },
                 {
                     "Id": "1",
                     "Nombre": "JavaScript",
                     "Code": "<pre><code class=\"language-javascript\">|</code></pre>"
                     },
                 {
                     "Id": "2",
                     "Nombre": "Apache Configuration",
                     "Code": "<pre><code class=\"language-apacheconf\">|</code></pre>"
                     },
                 {
                     "Id": "2",
                     "Nombre": "ASP.NET (C#)",
                     "Code": "<pre><code class=\"language-aspnet\">|</code></pre>"
                     },
                 {
                     "Id": "3",
                     "Nombre": "C",
                     "Code": "<pre><code class=\"language-csharp\">|</code></pre>"
                     },
                 {
                     "Id": "3",
                     "Nombre": "C#",
                     "Code": "<pre><code class=\"language-csharp\">|</code></pre>"
                     },
                 {
                     "Id": "4",
                     "Nombre": "C++",
                     "Code": "<pre><code class=\"language-cpp\">|</code></pre>"
                     },
                 {
                     "Id": "4",
                     "Nombre": "COBOL",
                     "Code": "<pre><code class=\"language-cobol\">|</code></pre>"
                     },
                 {
                     "Id": "5",
                     "Nombre": "CSV",
                     "Code": "<pre><code class=\"language-csv\">|</code></pre>"
                     },
                 {
                     "Id": "5",
                     "Nombre": "Django/Jinja2",
                     "Code": "<pre><code class=\"language-django\">|</code></pre>"
                     },
                 {
                     "Id": "6",
                     "Nombre": "DNS zone file",
                     "Code": "<pre><code class=\"language-dns-zone-file\">|</code></pre>"
                     },
                 {
                     "Id": "6",
                     "Nombre": "Docker",
                     "Code": "<pre><code class=\"language-docker\">|</code></pre>"
                     },
                 {
                     "Id": "7",
                     "Nombre": "EJS",
                     "Code": "<pre><code class=\"language-ejs\">|</code></pre>"
                     },
                 {
                     "Id": "7",
                     "Nombre": "Excel Formula",
                     "Code": "<pre><code class=\"language-excel-formula\">|</code></pre>"
                     },
                 {
                     "Id": "8",
                     "Nombre": "Git",
                     "Code": "<pre><code class=\"language-git\">|</code></pre>"
                     },
                 {
                     "Id": "8",
                     "Nombre": "Go",
                     "Code": "<pre><code class=\"language-go\">|</code></pre>"
                     },
                 {
                     "Id": "9",
                     "Nombre": "Gradle",
                     "Code": "<pre><code class=\"language-gradle\">|</code></pre>"
                     },
                 {
                     "Id": "9",
                     "Nombre": "GraphQL",
                     "Code": "<pre><code class=\"language-graphql\">|</code></pre>"
                     },
                 {
                     "Id": "10",
                     "Nombre": "HTTP Strict-Transport-Security",
                     "Code": "<pre><code class=\"language-hsts\">|</code></pre>"
                     },
                 {
                     "Id": "10",
                     "Nombre": "Java",
                     "Code": "<pre><code class=\"language-java\">|</code></pre>"
                     },
                 {
                     "Id": "11",
                     "Nombre": "JavaDoc",
                     "Code": "<pre><code class=\"language-javadoc\">|</code></pre>"
                     }
,
                 {
                     "Id": "11",
                     "Nombre": "Lua",
                     "Code": "<pre><code class=\"language-lua \">|</code></pre>"
                     },
                 {
                     "Id": "12",
                     "Nombre": "Kotlin + Kotlin Script",
                     "Code": "<pre><code class=\"language-kotlin\">|</code></pre>"
                     },
                 {
                     "Id": "12",
                     "Nombre": "MongoDB",
                     "Code": "<pre><code class=\"language-mongodb\">|</code></pre>"
                     },
                 {
                     "Id": "13",
                     "Nombre": "nginx",
                     "Code": "<pre><code class=\"language-nginx\">|</code></pre>"
                     },
                 {
                     "Id": "13",
                     "Nombre": "Perl",
                     "Code": "<pre><code class=\"language-perl\">|</code></pre>"
                     },
                 {
                     "Id": "14",
                     "Nombre": "PHPDoc",
                     "Code": "<pre><code class=\"language-phpdoc\">|</code></pre>"
                     },
                 {
                     "Id": "14",
                     "Nombre": "PL/SQL",
                     "Code": "<pre><code class=\"language-plsql\">|</code></pre>"
                     },
                 {
                     "Id": "15",
                     "Nombre": "Pug",
                     "Code": "<pre><code class=\"language-pug\">|</code></pre>"
                     },
                 {
                     "Id": "15",
                     "Nombre": "R",
                     "Code": "<pre><code class=\"language-r\">|</code></pre>"
                     },
                 {
                     "Id": "16",
                     "Nombre": "React JSX",
                     "Code": "<pre><code class=\"language-jsx\">|</code></pre>"
                     },
                 {
                     "Id": "16",
                     "Nombre": "Ruby",
                     "Code": "<pre><code class=\"language-ruby\">|</code></pre>"
                     },
                 {
                     "Id": "17",
                     "Nombre": "Splunk SPL",
                     "Code": "<pre><code class=\"language-splunk-spl\">|</code></pre>"
                     },
                 {
                     "Id": "17",
                     "Nombre": "SQL",
                     "Code": "<pre><code class=\"language-sql\">|</code></pre>"
                     },
                 {
                     "Id": "18",
                     "Nombre": "Swift",
                     "Code": "<pre><code class=\"language-swift\">|</code></pre>"
                     },
                 {
                     "Id": "18",
                     "Nombre": "TypeScript",
                     "Code": "<pre><code class=\"language-typescript\">|</code></pre>"
                     },
                 {
                     "Id": "19",
                     "Nombre": "VB.Net",
                     "Code": "<pre><code class=\"language-vbnet\">|</code></pre>"
                     },
                 {
                     "Id": "19",
                     "Nombre": "Visual Basic + VBA",
                     "Code": "<pre><code class=\"language-visual-basic\">|</code></pre>"
                     },
                 {
                     "Id": "20",
                     "Nombre": "XML doc (.net)",
                     "Code": "<pre><code class=\"language-xml-doc\">|</code></pre>"
                     }];
             $('#refreIframe').click(function () {
                 let combo = document.getElementById('cboCodePrism')
                 combo.innerHTML = '<option value="0">Seleccione un Tipo de Codigo ...</option>';

                 $(listaCode).each(function () {
                     let option = $(document.createElement("option"));
                     option.text(this.Nombre);
                     option.val(this.Id);
                     $("#cboCodePrism").append(option);
                 });
             });


             $("#cboCodePrism").on('change', function () {
                 let id = $("#cboCodePrism option:selected").val();
                 let codigo = listaCode.find(t => t.Id === id).Code;
                 console.log(listaCode)
                 $("#iframe_insert").val(codigo);
             });

             this.show = function () {
                 var text = context.invoke('editor.getSelectedText');
                 context.invoke('editor.saveRange');
                 this
                     .showIframeDialog(text)
                     .then(function (data) {
                         // [workaround] hide dialog before restore range for IE range focus
                         ui.hideDialog(self.$dialog);
                         context.invoke('editor.restoreRange');

                         if (currentEditing) {
                             self.updateIframeNode(data);
                         } else {
                             // build node
                             var $node = self.createIframeNode(data);

                             if ($node) {
                                 // insert iframe node
                                 context.invoke('editor.insertNode', $node);
                             }


                         }

                     })
                     .fail(function () {
                         context.invoke('editor.restoreRange');
                     });
             };

             this.showIframeDialog = function (text) {
                 return $.Deferred(function (deferred) {
                     var $iframeUrl = self.$dialog.find('.ext-iframe-url');
                     var $iframeTitle = self.$dialog.find('.ext-iframe-title');
                     var $iframeBtn = self.$dialog.find('.ext-iframe-btn');

                     ui.onDialogShown(self.$dialog, function () {
                         context.triggerEvent('dialog.shown');

                         var dataSrc = currentEditing ? $(currentEditing).attr('data-src') : '';
                         var dataTitle = currentEditing ? $(currentEditing).attr('data-title') : '';

                         $iframeTitle.val(dataTitle);
                         $iframeUrl.val(dataSrc).on('input', function () {
                             ui.toggleBtn($iframeBtn, $iframeUrl.val());
                         }).trigger('focus');

                         $iframeBtn.click(function (event) {
                             event.preventDefault();

                             deferred.resolve({
                                 url: $iframeUrl.val(),
                                 title: $iframeTitle.val()
                             });
                         });
                         // self.bindEnterKey($iframeUrl, $iframeBtn);
                     });

                     ui.onDialogHidden(self.$dialog, function () {
                         $iframeUrl.off('input');
                         $iframeBtn.off('click');

                         if (deferred.state() === 'pending') {
                             deferred.reject();
                         }
                     });
                     ui.showDialog(self.$dialog);
                 });
             };
         }
     });
 }));


 $.extend(true, $.summernote, {
     lang: {
         'en-US': {
             iframe: {
                 iframe: 'iframe',
                 url: 'Codigo HTML',
                 title: 'Título',
                 insertOrUpdate: 'Agregar',
                 alt: 'Coversor',
                 alttext: 'you should provide a text alternative for the content in this iframe.',
                 test: 'Test'
             },
         },
     },
 });