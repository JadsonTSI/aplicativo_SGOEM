import re
import os

files_mapping = {
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\grupos\templates\grupos\detalhes.html": "grupos",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\grupos\templates\grupos\enviar_partitura.html": "grupos",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\grupos\templates\grupos\lista.html": "grupos",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\materias\templates\materias\professor_editar_link.html": "materias",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\materias\templates\materias\professor_lista.html": "materias",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\apresentacoes_form.html": "apresentacoes",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\apresentacoes_list.html": "apresentacoes",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\ensaios_confirm_delete.html": "ensaios",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\ensaios_list.html": "ensaios",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\ensaios_pro.html": "ensaios",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\naipe_detalhe.html": "naipes",
    r"c:\Users\jadso\Documents\abanfar-bf\abanfar_bf\professores\templates\professores\naipes.html": "naipes",
}

def generate_nav(active_name):
    active_inicio = " active" if active_name == "inicio" else ""
    active_naipes = " active" if active_name == "naipes" else ""
    active_materias = " active" if active_name == "materias" else ""
    active_ensaios = " active" if active_name == "ensaios" else ""
    active_apresentacoes = " active" if active_name == "apresentacoes" else ""
    active_grupos = " active" if active_name == "grupos" else ""
    active_perfil = " active" if active_name == "perfil" else ""
    
    return f"""        <nav class="sidebar-nav">
            <div class="nav-section-label">Principal</div>
            <a href="{{% url 'professores:professoreshome' %}}" class="sidebar-link{active_inicio}"><i class="bi bi-house-door-fill"></i><span class="nav-label">Início</span></a>
            <div class="nav-section-label mt-2">Meu Ensino</div>
            <a href="{{% url 'professores:naipes' %}}" class="sidebar-link{active_naipes}"><i class="bi bi-music-note"></i><span class="nav-label">Naipes</span></a>
            <a href="{{% url 'materias:materias_professor' %}}" class="sidebar-link{active_materias}"><i class="bi bi-journal-bookmark-fill"></i><span class="nav-label">Minhas Matérias</span></a>
            <a href="{{% url 'professores:ensaiospro' %}}" class="sidebar-link{active_ensaios}"><i class="bi bi-music-note-beamed"></i><span class="nav-label">Ensaios</span></a>
            <a href="{{% url 'professores:apresentacoes_list' %}}" class="sidebar-link{active_apresentacoes}"><i class="bi bi-grid-3x3-gap-fill"></i><span class="nav-label">Apresentações</span></a>
            <a href="{{% url 'grupos:lista' %}}" class="sidebar-link{active_grupos}"><i class="bi bi-music-note-list"></i><span class="nav-label">Grupos Musicais</span></a>
            <div class="nav-section-label mt-2">Conta</div>
            <a href="{{% url 'contas:perfil' %}}" class="sidebar-link{active_perfil}"><i class="bi bi-person-circle"></i><span class="nav-label">Meu Perfil</span></a>
        </nav>"""

for fpath, active_name in files_mapping.items():
    if not os.path.exists(fpath):
        print(f"Skipping: {fpath} (Not found)")
        continue
        
    with open(fpath, "r", encoding="utf-8") as file:
        content = file.read()
        
    # Standardize the sidebar navigation section
    new_nav = generate_nav(active_name)
    
    # We want to replace the entire <nav class="sidebar-nav"> ... </nav> block
    pattern = r'<nav class="sidebar-nav">.*?</nav>'
    updated_content, count = re.subn(pattern, new_nav, content, flags=re.DOTALL)
    
    if count > 0:
        with open(fpath, "w", encoding="utf-8") as file:
            file.write(updated_content)
        print(f"Successfully updated: {os.path.basename(fpath)}")
    else:
        print(f"Failed to match <nav> block in: {os.path.basename(fpath)}")
