package br.com.caritas.service;

import br.com.caritas.entity.Address;
import br.com.caritas.entity.parish.ParishEntity;
import br.com.caritas.entity.user.AdminEntity;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class StartupService {

    @Transactional
    public void onStartup(@Observes StartupEvent event) {
        if(ParishEntity.count() == 0) {
            ParishEntity diocese = new ParishEntity();
            diocese.name = "Cáritas Diocesana";
            diocese.cnpj = "18724720000165";
            diocese.isDiocese = true;

            Address address = new Address();
            address.street = "Rua Dr. Emilio Ataliba Finger";
            address.number = 685;
            address.city = "Caxias do Sul";
            address.state = "RS";
            address.postalCode = "95032-262";

            diocese.address = address;
            diocese.persist();
        }

        if(AdminEntity.count() == 0) {
            AdminEntity admin = new AdminEntity();
            admin.name = "João";
            admin.email = "joao@gmail.com";
            admin.password = BcryptUtil.bcryptHash("joao123");
            admin.active = true;
            admin.persist();
        }
    }
}
